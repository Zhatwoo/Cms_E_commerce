// controllers/domainController.js
const Domain = require('../models/Domain');
const Project = require('../models/Project');
const Page = require('../models/Page');
const User = require('../models/User');
const { getRealtimeDb, db } = require('../config/firebase');
const { getLimits } = require('../utils/subscriptionLimits');

const BASE_DOMAIN = process.env.BASE_DOMAIN || process.env.NEXT_PUBLIC_BASE_DOMAIN || 'cms.com';

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
    const rows = [];
    for (const doc of published) {
      const subdomain = doc.id || '';
      const userId = doc.userId || doc.user_id;
      const status = (doc.status || 'published').toString().toLowerCase();
      const statusDisplay = status === 'published' ? 'Live' : status === 'draft' ? 'Draft' : status === 'flagged' ? 'Flagged' : status;
      const domainName = subdomain ? `${subdomain}.${BASE_DOMAIN}` : '—';
      let owner = 'Unknown User';
      let planDisplay = 'Free';
      if (userId) {
        try {
          const user = await User.findById(userId);
          if (user) {
            owner = user.displayName || user.fullName || user.email || owner;
            const plan = (user.subscriptionPlan || 'free').toString().trim().toLowerCase();
            planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);
          }
        } catch (e) {
          // keep defaults
        }
      }
      rows.push({
        id: doc.domainId || doc.id || subdomain,
        userId: userId || '',
        domainName,
        owner,
        status: statusDisplay,
        plan: planDisplay,
        domainType: 'Subdomain',
      });
    }
    const total = rows.length;
    const live = rows.filter((r) => r.status === 'Live').length;
    const underReview = rows.filter((r) => r.status === 'Draft').length;
    const flagged = rows.filter((r) => r.status === 'Flagged').length;
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

    // Check subscription limits
    const user = await User.findById(userId);
    const limits = getLimits(user?.subscriptionPlan);
    const publishedList = await Domain.listByClient(userId);
    const existingDomain = await Domain.findByProjectId(userId, projectId);

    const project = await Project.get(userId, String(projectId).trim());
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 1. PROJECT-BASED SUBDOMAIN RESERVATION LIMIT
    if (!project.subdomain) {
      const reservedCount = await Project.countWithSubdomain(userId);
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
    const data = await Domain.publishForClientBatch(userId, {
      projectId: String(projectId).trim(),
      projectTitle: project.title,
      subdomain,
      publishedContent,
    });

    // So Domains dashboard shows the published domain: update project subdomain in Firestore and Realtime DB
    await Project.update(userId, projectId, { subdomain, status: 'published' });
    const rtdb = getRealtimeDb();
    if (rtdb) {
      try {
        const rtdbRef = rtdb.ref(`user/roles/client/${userId}/projects/${projectId}`);
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
    const project = await Project.get(userId, String(projectId).trim());
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const subdomain = (subdomainOverride && String(subdomainOverride).trim())
      ? String(subdomainOverride).trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
      : (project.subdomain || (project.title || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site');

    let scheduledContent = requestedContent ?? null;
    if (scheduledContent == null) {
      try {
        const draft = await Page.getPageData(userId, String(projectId).trim(), userId);
        if (draft && draft.content) scheduledContent = draft.content;
      } catch (e) {
        console.warn('schedulePublish: could not read draft:', e.message);
      }
    }

    const data = await Domain.schedulePublish(userId, {
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
        await Domain.setSubdomainLookup(sub, {
          userId,
          projectId: d.projectId,
          domainId: d.id,
          status: 'published',
          projectTitle: d.projectTitle || null,
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
