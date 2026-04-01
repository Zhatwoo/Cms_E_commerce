// controllers/domainController.js
const Domain = require('../models/Domain');
const Project = require('../models/Project');
const Page = require('../models/Page');
const User = require('../models/User');
const { getRealtimeDb, db } = require('../config/firebase');
const { getLimits } = require('../utils/subscriptionLimits');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');
const { sendAdminActionEmail } = require('../utils/emailService');
const Notification = require('../models/Notification');

const BASE_DOMAIN = process.env.BASE_DOMAIN || process.env.NEXT_PUBLIC_BASE_DOMAIN || 'cms.com';

async function buildOwnerSnapshot(userId) {
  if (!userId) return null;

  let user = null;
  try {
    user = await User.findById(userId);
  } catch {
    user = null;
  }

  if (!user) {
    try {
      const authUser = await auth.getUser(userId);
      return {
        id: userId,
        email: authUser.email || '',
        name: authUser.displayName || authUser.email || 'Client',
        avatar: authUser.photoURL || null,
        username: '',
        subscriptionPlan: null,
      };
    } catch {
      return { id: userId };
    }
  }

  return {
    id: user.id || userId,
    email: user.email || '',
    name: user.displayName || user.fullName || user.name || user.email || 'Client',
    avatar: user.avatar || null,
    username: user.username || '',
    subscriptionPlan: user.subscriptionPlan || null,
  };
}

// List for current user (protect)
exports.getMyDomains = async (req, res) => {
  try {
    const items = await Domain.listByClient(req.user.id);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: list all websites by fetching from Firestore published_subdomains; owner/plan from user/roles/client
exports.getManagementList = async (req, res) => {
  try {
    const published = await Domain.listAllFromPublishedSubdomains();
    const clients = await User.findAll({ role: 'client' });
    const ownerMap = new Map();
    clients.forEach((user) => {
      const owner = user.displayName || user.fullName || user.email || 'Unknown User';
      const plan = (user.subscriptionPlan || 'free').toString().trim().toLowerCase();
      const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
      ownerMap.set(user.id, { owner, planDisplay });
    });

    const rowsByKey = new Map();
    const rowKeyByProject = new Map();
    const rowKeyBySubdomain = new Map();
    const publishedSubdomains = new Set();
    const normalizeStatus = (rawStatus, fallback = 'draft') => {
      const status = (rawStatus || fallback).toString().trim().toLowerCase();
      if (status === 'live' || status === 'active') return 'published';
      return status;
    };

    for (const doc of published) {
      const subdomain = doc.id || '';
      const userId = doc.userId || doc.user_id;
      const rawProjectId = doc.projectId || doc.project_id || '';
      const status = normalizeStatus(doc.status, 'published');
      const domainName = subdomain ? `${subdomain}.${BASE_DOMAIN}` : '—';
      let projectId = rawProjectId ? String(rawProjectId).trim() : '';
      let projectThumbnail = null;
      let projectIndustry = null;
      const ownerInfo = ownerMap.get(userId) || { owner: 'Unknown User', planDisplay: 'Free' };
      if (userId) {
        // Best-effort project lookup so admin cards can render real thumbnails.
        try {
          let project = null;
          if (projectId) {
            project = await Project.get(userId, projectId);
          }
          if (!project && subdomain) {
            project = await Project.getBySubdomain(userId, subdomain);
          }
          if (project) {
            projectId = String(project.id || projectId || '').trim();
            projectThumbnail = project.thumbnail || null;
            projectIndustry = project.industry || null;
          }
        } catch (e) {
          // keep defaults
        }
      }

      const key = projectId ? `${userId}::${projectId}` : `subdomain::${subdomain}`;
      rowsByKey.set(key, {
        id: doc.domainId || doc.domain_id || doc.id || subdomain,
        projectId,
        userId: userId || '',
        domainName,
        thumbnail: projectThumbnail || undefined,
        industry: projectIndustry || undefined,
        owner: ownerInfo.owner,
        status,
        plan: ownerInfo.planDisplay,
        domainType: 'Subdomain',
      });
      if (projectId) {
        rowKeyByProject.set(`${userId}::${projectId}`, key);
      }
      if (subdomain) {
        const normalizedSubdomain = String(subdomain).trim().toLowerCase();
        if (status === 'published') {
          publishedSubdomains.add(normalizedSubdomain);
        }
        rowKeyBySubdomain.set(`${userId}::${normalizedSubdomain}`, key);
      }
    }

    for (const client of clients) {
      const projects = await Project.list(client.id);
      projects.forEach((project) => {
        const projectId = String(project.id || '').trim();
        if (!projectId) return;
        const projectKey = `${client.id}::${projectId}`;
        const normalizedSubdomain = String(project.subdomain || '').trim().toLowerCase();
        const subdomainKey = normalizedSubdomain ? `${client.id}::${normalizedSubdomain}` : '';
        const existingRowKey = rowKeyByProject.get(projectKey) || (subdomainKey ? rowKeyBySubdomain.get(subdomainKey) : null);
        const existing = existingRowKey ? rowsByKey.get(existingRowKey) : null;
        if (existing) {
          if (!existing.thumbnail && project.thumbnail) {
            existing.thumbnail = project.thumbnail;
          }
          if (!existing.industry && project.industry) {
            existing.industry = project.industry;
          }
          if ((!existing.domainName || existing.domainName === '—') && project.subdomain) {
            existing.domainName = `${project.subdomain}.${BASE_DOMAIN}`;
          }
          if (!existing.projectId) {
            existing.projectId = projectId;
          }
          if (existing.status !== 'published') {
            const projectStatus = normalizeStatus(project.status, 'draft');
            const isPublishedByLookup = normalizedSubdomain && publishedSubdomains.has(normalizedSubdomain);
            existing.status = isPublishedByLookup ? 'published' : projectStatus;
          }
          rowsByKey.set(existingRowKey || projectKey, existing);
          rowKeyByProject.set(projectKey, existingRowKey || projectKey);
          if (subdomainKey) {
            rowKeyBySubdomain.set(subdomainKey, existingRowKey || projectKey);
          }
          return;
        }

        const isPublishedByLookup = normalizedSubdomain && publishedSubdomains.has(normalizedSubdomain);
        const normalizedStatus = isPublishedByLookup ? 'published' : normalizeStatus(project.status, 'draft');
        const domainName = project.subdomain
          ? `${project.subdomain}.${BASE_DOMAIN}`
          : `${project.title || 'Untitled Project'} (Draft)`;
        rowsByKey.set(projectKey, {
          id: projectId,
          projectId,
          userId: client.id,
          domainName,
          thumbnail: project.thumbnail || undefined,
          industry: project.industry || undefined,
          owner: client.displayName || client.fullName || client.email || 'Unknown User',
          status: normalizedStatus,
          plan: ((client.subscriptionPlan || 'free').toString().trim().toLowerCase().replace(/^./, (ch) => ch.toUpperCase())),
          domainType: project.subdomain ? 'Subdomain' : 'Project',
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        });
        rowKeyByProject.set(projectKey, projectKey);
        if (subdomainKey) {
          rowKeyBySubdomain.set(subdomainKey, projectKey);
        }
      });
    }

    const rows = Array.from(rowsByKey.values());
    const total = rows.length;
    const live = rows.filter((r) => r.status === 'published').length;
    const underReview = rows.filter((r) => r.status === 'draft' || r.status === 'pending').length;
    const flagged = rows.filter((r) => r.status === 'flagged').length;
    res.status(200).json({
      success: true,
      data: rows,
      stats: { total, live, underReview, flagged },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: set client domain status (user/roles/client/{userId}/domains + published_subdomains)
exports.setClientDomainStatus = async (req, res) => {
  try {
    const { userId, domainId, status } = req.body;
    if (!userId || !domainId || !String(status).trim()) {
      return res.status(400).json({ success: false, message: 'userId, domainId, and status are required' });
    }
    const normalized = String(status).trim().toLowerCase();
    if (!['published', 'suspended', 'flagged', 'draft'].includes(normalized)) {
      return res.status(400).json({ success: false, message: 'status must be published, suspended, flagged, or draft' });
    }
    const updated = await Domain.updateForClient(userId, domainId, { status: normalized });
    const subdomain = (updated && updated.subdomain) ? String(updated.subdomain).trim() : null;
    if (subdomain) {
      await db.collection('published_subdomains').doc(subdomain).set(
        { status: normalized, updated_at: new Date() },
        { merge: true }
      );
    }

    res.status(200).json({ success: true, message: 'Status updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.adminWebsiteAction = async (req, res) => {
  try {
    const { userId, domainId, action, reason } = req.body || {};
    const normalizedAction = String(action || '').trim().toLowerCase();
    const actionReason = String(reason || '').trim();

    if (!userId || !domainId || !normalizedAction) {
      return res.status(400).json({ success: false, message: 'userId, domainId, and action are required' });
    }

    if (!['take_down', 'delete'].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: 'action must be take_down or delete' });
    }

    let domain = await Domain.get(userId, domainId);
    if (!domain) {
      // Try finding by project_id in case the frontend passed projectId as the ID
      domain = await Domain.findByProjectId(userId, domainId);
    }

    if (!domain) {
      // Try finding by subdomain (in case domainId is the subdomain string)
      const potential = await Domain.findBySubdomain(domainId);
      if (potential && potential.userId === userId && potential.id) {
        domain = await Domain.get(userId, potential.id);
      }
    }

    // Identify project if possible
    let project = null;
    const resolvedProjectId = domain?.projectId || domainId;
    if (resolvedProjectId) {
      project = await Project.get(userId, resolvedProjectId);
    }

    if (!domain && !project) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const targetProjectId = domain?.projectId || (project ? project.id : null);
    const targetSubdomain = domain?.subdomain || (project ? project.subdomain : null) || domainId;

    if (normalizedAction === 'take_down') {
      if (domain && targetProjectId) {
        await Domain.unpublishForClient(userId, targetProjectId);
        await Project.update(userId, targetProjectId, { status: 'draft' });
      } else if (project) {
        // If it's only a project (no domain doc), ensure it's in draft status
        await Project.update(userId, project.id, { status: 'draft' });
      } else {
        return res.status(400).json({ success: false, message: 'Cannot take down website: missing project mapping' });
      }
    } else {
      // Action: delete
      if (domain && targetProjectId) {
        await Domain.unpublishForClient(userId, targetProjectId);
        await Project.update(userId, targetProjectId, { status: 'draft' });
        await Project.delete(userId, targetProjectId);
      } else if (domain) {
        // Domain with no project mapping
        await Domain.deleteForClient(userId, domain.id);
      } else if (project) {
        // Project with no domain mapping (e.g. unpublished draft)
        await Project.delete(userId, project.id);
      }
    }

    const owner = await User.findById(userId);
    const ownerEmail = owner?.email || '';
    let emailSent = false;
    let emailError = '';

    if (ownerEmail) {
      const mail = await sendAdminActionEmail({
        to: ownerEmail,
        name: owner?.displayName || owner?.fullName || owner?.email || 'Client',
        subject: normalizedAction === 'take_down' ? 'Website taken down by admin' : 'Website deleted by admin',
        title: normalizedAction === 'take_down' ? 'Your website was taken down' : 'Your website was deleted',
        intro: normalizedAction === 'take_down'
          ? `Website ${targetSubdomain ? `\"${targetSubdomain}\"` : ''} has been taken offline by an administrator.`
          : `Website ${targetSubdomain ? `\"${targetSubdomain}\"` : ''} has been deleted by an administrator.`,
        reason: actionReason,
      });
      emailSent = !!mail?.sent;
      emailError = mail?.error || '';
    } else {
      emailError = 'Recipient email not found';
    }

    // Real-time notification
    try {
      const notif = await Notification.create({
        title: normalizedAction === 'take_down' ? 'Website Offline' : 'Website Deleted',
        message: `${targetSubdomain || domainId} was ${normalizedAction === 'take_down' ? 'taken down' : 'deleted'} by admin`,
        type: normalizedAction === 'take_down' ? 'warning' : 'error',
        adminId: req.user?.id || 'admin',
        adminName: req.user?.name || req.user?.email || 'Administrator'
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) {
      console.warn('Admin action notification failed:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: normalizedAction === 'take_down' ? 'Website taken down successfully' : 'Website deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

// Get one by id (owner or admin)
exports.getOne = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    if (req.user.role !== 'Admin' && domain.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, data: domain });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create (protect)
exports.create = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || !String(domain).trim()) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }
    const data = await Domain.create({
      userId: req.user.id,
      domain: String(domain).trim().toLowerCase(),
      status: 'Pending'
    });
    res.status(201).json({ success: true, message: 'Domain added', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete (protect, owner only - or admin)
exports.delete = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    if (req.user.role !== 'Admin' && domain.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Domain.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Domain deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Publish: create/update domain and save a snapshot of current draft so public site shows only published content
exports.publish = async (req, res) => {
  try {
    const { projectId, subdomain: subdomainOverride, content: requestedContent } = req.body;
    if (!projectId || !String(projectId).trim()) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();

    // Verify ownership/permissions
    const resolved = await resolveProjectOwner(userId, String(projectId).trim(), userEmail);
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (resolved.permission !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the project owner can publish this project' });
    }

    const ownerId = resolved.ownerId;
    const project = await Project.get(ownerId, String(projectId).trim());

    // Check subscription limits using owner's plan
    const user = await User.findById(ownerId);
    const limits = getLimits(user?.subscriptionPlan);
    const publishedList = await Domain.listByClient(ownerId);
    const existingDomain = await Domain.findByProjectId(ownerId, projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 1. PROJECT-BASED SUBDOMAIN RESERVATION LIMIT
    if (!project.subdomain) {
      const reservedCount = await Project.countWithSubdomain(ownerId);
      if (reservedCount >= limits.domains) {
        return res.status(403).json({
          success: false,
          message: `Limit reached: Your plan has reached its limit. Please upgrade your subscription to add more domains or projects. Your current ${user?.subscriptionPlan || 'free'} plan allows up to ${limits.domains} domains.`,
        });
      }
    }

    // 2. ACTUAL PUBLISHED DOMAINS LIMIT
    // Block if it's a NEW publication and they are at the limit.
    if (!existingDomain && publishedList.length >= limits.domains) {
      return res.status(403).json({
        success: false,
        message: `Limit reached: Your plan has reached its limit. Please upgrade your subscription to add more domains or projects. Your current ${user?.subscriptionPlan || 'free'} plan allows up to ${limits.domains} domains.`,
      });
    }

    // 3. OVER-LIMIT PROTECTION: If already way over (e.g. they have 5 domains on Free limit 3)
    // block any publish action until they are under limit.
    if (publishedList.length > limits.domains) {
      return res.status(403).json({
        success: false,
        message: `Limit reached: Your plan has reached its limit (currently ${publishedList.length}/${limits.domains}). Please upgrade your subscription or remove domains to proceed.`,
      });
    }

    const subdomain = (subdomainOverride && String(subdomainOverride).trim())
      ? String(subdomainOverride).trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
      : (project.subdomain || (project.title || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site');

    // Snapshot current draft so published site shows only this until next Publish (not live draft)
    let publishedContent = requestedContent ?? null;
    if (publishedContent == null) {
      try {
        const draft = await Page.getPageData(userId, String(projectId).trim(), userId);
        if (draft && draft.content) publishedContent = draft.content;
      } catch (e) {
        console.warn('publish: could not read draft for snapshot:', e.message);
      }
    }

    // Save to BOTH paths with published_content snapshot
    const ownerSnapshot = await buildOwnerSnapshot(ownerId);
    const data = await Domain.publishForClientBatch(ownerId, {
      projectId: String(projectId).trim(),
      projectTitle: project.title,
      subdomain,
      publishedContent,
      ownerProfile: ownerSnapshot,
    });

    // So Domains dashboard shows the published domain: update project subdomain in Firestore and Realtime DB
    await Project.update(ownerId, projectId, { subdomain, status: 'published' });

    const publisherName = [
      req.user?.displayName,
      req.user?.fullName,
      req.user?.name,
      req.user?.email,
    ].find((value) => typeof value === 'string' && value.trim()) || 'Unknown publisher';

    // Broadcast to Admins: New Content Published
    try {
      const notif = await Notification.create({
        title: 'Website Published',
        message: `${project.title || subdomain} has just gone live! Published by ${publisherName}.`,
        type: 'success',
        adminId: req.user?.id || 'system',
        adminName: publisherName
      });
      if (req.app.get('io')) req.app.get('io').emit('notification:added', notif);
    } catch (e) {
      console.warn('Publish notification failed:', e.message);
    }

    const rtdb = getRealtimeDb();
    if (rtdb) {
      try {
        const rtdbRef = rtdb.ref(`user/roles/client/${ownerId}/projects/${projectId}`);
        await rtdbRef.update({ subdomain });
      } catch (e) {
        console.warn('publish: Realtime DB sync failed:', e.message);
      }
    }

    res.status(200).json({ success: true, message: 'Published', data: { ...data, subdomain } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Unpublish: set project and domain status to draft so site is taken offline
exports.unpublish = async (req, res) => {
  try {
    const { projectId } = req.body;
    const trimmedProjectId = projectId ? String(projectId).trim() : '';
    if (!trimmedProjectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();

    const resolved = await resolveProjectOwner(userId, trimmedProjectId, userEmail);
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (resolved.permission !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the project owner can unpublish this site' });
    }

    const ownerId = resolved.ownerId;
    const project = await Project.get(ownerId, trimmedProjectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const data = await Domain.unpublishForClient(ownerId, trimmedProjectId);
    if (!data) {
      return res.status(400).json({ success: false, message: 'Domain not found or already in draft' });
    }
    await Project.update(ownerId, trimmedProjectId, { status: 'draft' });
    const rtdb = getRealtimeDb();
    if (rtdb) {
      try {
        const rtdbRef = rtdb.ref(`user/roles/client/${ownerId}/projects/${trimmedProjectId}`);
        await rtdbRef.update({ status: 'draft' });
      } catch (e) {
        console.warn('unpublish: Realtime DB sync failed:', e.message);
      }
    }
    res.status(200).json({ success: true, message: 'Site taken offline', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update subdomain for an existing published project
exports.updateSubdomain = async (req, res) => {
  try {
    const { projectId, subdomain } = req.body;
    if (!projectId || !String(projectId).trim()) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    if (!subdomain || !String(subdomain).trim()) {
      return res.status(400).json({ success: false, message: 'subdomain is required' });
    }
    const normalized = String(subdomain).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized) {
      return res.status(400).json({ success: false, message: 'Subdomain must contain only letters, numbers, and hyphens' });
    }
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();

    const resolved = await resolveProjectOwner(userId, String(projectId).trim(), userEmail);
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (resolved.permission !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the project owner can update the subdomain' });
    }

    const ownerId = resolved.ownerId;
    const project = await Project.get(ownerId, String(projectId).trim());
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const ownerSnapshot = await buildOwnerSnapshot(ownerId);
    const data = await Domain.updateSubdomainForClient(ownerId, String(projectId).trim(), normalized, ownerSnapshot);
    if (!data) {
      return res.status(400).json({ success: false, message: 'Domain not found. Publish the site first.' });
    }
    await Project.update(ownerId, projectId, { subdomain: normalized });
    const rtdb = getRealtimeDb();
    if (rtdb) {
      try {
        const rtdbRef = rtdb.ref(`user/roles/client/${ownerId}/projects/${projectId}`);
        await rtdbRef.update({ subdomain: normalized });
      } catch (e) {
        console.warn('updateSubdomain: Realtime DB sync failed:', e.message);
      }
    }
    res.status(200).json({ success: true, message: 'Subdomain updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: update subdomain for a client project/domain
exports.adminUpdateClientSubdomain = async (req, res) => {
  try {
    const { userId, projectId, domainId, subdomain } = req.body || {};
    if (!userId || !String(userId).trim()) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    if (!subdomain || !String(subdomain).trim()) {
      return res.status(400).json({ success: false, message: 'subdomain is required' });
    }

    const ownerId = String(userId).trim();
    const normalized = String(subdomain).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized) {
      return res.status(400).json({ success: false, message: 'Subdomain must contain only letters, numbers, and hyphens' });
    }

    const providedProjectId = projectId ? String(projectId).trim() : '';
    const providedDomainId = domainId ? String(domainId).trim() : '';
    let targetProjectId = providedProjectId;

    let domain = null;
    if (providedDomainId) {
      domain = await Domain.get(ownerId, providedDomainId);
      if (!domain) {
        domain = await Domain.findByProjectId(ownerId, providedDomainId);
      }
      if (!domain) {
        const bySubdomain = await Domain.findBySubdomain(providedDomainId);
        if (bySubdomain && bySubdomain.userId === ownerId && bySubdomain.id) {
          domain = await Domain.get(ownerId, bySubdomain.id);
        }
      }
    }

    if (!targetProjectId && domain?.projectId) {
      targetProjectId = String(domain.projectId).trim();
    }

    if (!targetProjectId && providedDomainId) {
      targetProjectId = providedDomainId;
    }

    if (!targetProjectId) {
      return res.status(400).json({ success: false, message: 'projectId or domainId is required' });
    }

    const project = await Project.get(ownerId, targetProjectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const ownerSnapshot = await buildOwnerSnapshot(ownerId);
    const data = await Domain.updateSubdomainForClient(ownerId, targetProjectId, normalized, ownerSnapshot);
    if (!data) {
      return res.status(400).json({ success: false, message: 'Domain not found. Publish the site first.' });
    }

    await Project.update(ownerId, targetProjectId, { subdomain: normalized });

    const rtdb = getRealtimeDb();
    if (rtdb) {
      try {
        const rtdbRef = rtdb.ref(`user/roles/client/${ownerId}/projects/${targetProjectId}`);
        await rtdbRef.update({ subdomain: normalized });
      } catch (e) {
        console.warn('adminUpdateClientSubdomain: Realtime DB sync failed:', e.message);
      }
    }

    res.status(200).json({ success: true, message: 'Subdomain updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Schedule publish: set a date when current draft will go live (must have published at least once)
exports.schedulePublish = async (req, res) => {
  try {
    const { projectId, subdomain: subdomainOverride, scheduledAt, content: requestedContent } = req.body;
    if (!projectId || !String(projectId).trim()) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'scheduledAt is required (ISO date string)' });
    }
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();

    const resolved = await resolveProjectOwner(userId, String(projectId).trim(), userEmail);
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (resolved.permission !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the project owner can schedule publishing' });
    }

    const ownerId = resolved.ownerId;
    const project = await Project.get(ownerId, String(projectId).trim());
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const subdomain = (subdomainOverride && String(subdomainOverride).trim())
      ? String(subdomainOverride).trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
      : (project.subdomain || (project.title || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site');

    let scheduledContent = requestedContent ?? null;
    if (scheduledContent == null) {
      try {
        const draft = await Page.getPageData(ownerId, String(projectId).trim(), ownerId);
        if (draft && draft.content) scheduledContent = draft.content;
      } catch (e) {
        console.warn('schedulePublish: could not read draft:', e.message);
      }
    }

    const data = await Domain.schedulePublish(ownerId, {
      projectId: String(projectId).trim(),
      projectTitle: project.title,
      subdomain,
      scheduledAt,
      scheduledContent,
    });

    res.status(200).json({ success: true, message: 'Scheduled', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};

// Get scheduled publish for a project (if any)
exports.getSchedule = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId || !String(projectId).trim()) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const userId = req.user.id;
    const schedule = await Domain.getScheduleByProject(userId, String(projectId).trim());
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get publish history for a project (stack of last publish/update times)
exports.getPublishHistory = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId || !String(projectId).trim()) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const userId = req.user.id;
    const history = await Domain.getPublishHistoryByProject(userId, String(projectId).trim());
    res.status(200).json({ success: true, data: { history } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Sync public lookup from user/roles/client/{userId}/domains so GET /api/public/sites/:subdomain works
exports.syncPublicLookup = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Domain.listByClient(userId);
    let synced = 0;
    for (const d of items) {
      const sub = (d.subdomain || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (sub && (d.status || 'published') === 'published') {
        const ownerSnapshot = await buildOwnerSnapshot(userId);
        await Domain.setSubdomainLookup(sub, {
          userId,
          projectId: d.projectId,
          domainId: d.id,
          status: 'published',
          projectTitle: d.projectTitle || null,
          ownerProfile: ownerSnapshot,
        });
        synced++;
      }
    }
    res.status(200).json({ success: true, message: `Synced ${synced} site(s).`, synced });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: list all domains
exports.getAll = async (req, res) => {
  try {
    const { userId, status } = req.query;
    const filters = {};
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    const items = await Domain.findAll(filters);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: update domain status
exports.updateStatus = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    const { status } = req.body;
    const allowed = ['Pending', 'Active', 'Error'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required: ' + allowed.join(', ') });
    }
    const updates = { status };
    if (status === 'Active') updates.verifiedAt = new Date().toISOString();
    const data = await Domain.update(req.params.id, updates);
    res.status(200).json({ success: true, message: 'Domain updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
