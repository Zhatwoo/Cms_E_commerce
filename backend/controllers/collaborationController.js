// collaborationController.js
// Handles HTTP endpoints for collaboration invites and project sharing
const { db } = require('../config/firebase');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');
const { sendCollaborationInviteEmail } = require('../utils/emailService');

const COLLAB_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

function getCollabRef(projectOwnerId, projectId) {
    return db
        .collection('user').doc('roles')
        .collection('client').doc(projectOwnerId)
        .collection('projects').doc(projectId)
        .collection('collaborators');
}

// @desc   Invite a collaborator to a project (by email)
// @route  POST /api/collaboration/:projectId/invite
// @access Private (project owner only)
exports.invite = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();
        const { projectId } = req.params;
        const { email, permission = 'editor' } = req.body || {};

        console.log(`[Collab] Invite request by user ${userId} (${userEmail}) for project ${projectId}`);

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        // Check if the current user has permission to invite
        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        console.log(`[Collab] Resolved permission for ${userId}:`, resolved);

        if (!resolved || (resolved.permission !== 'owner' && resolved.permission !== 'editor')) {
            console.log(`[Collab] Permission denied for invite.`);
            return res.status(403).json({ success: false, message: 'You do not have permission to invite collaborators to this project.' });
        }
        const ownerId = resolved.ownerId;
        console.log(`[Collab] Using ownerId: ${ownerId}`);

        // Validate permission value
        const allowed = ['viewer', 'editor'];
        if (!allowed.includes(permission)) {
            return res.status(400).json({ success: false, message: 'Invalid permission. Use "viewer" or "editor".' });
        }

        // Find target user by email
        const userSnap = await db.collection('user').doc('roles').collection('client').get();
        let targetUser = null;
        for (const doc of userSnap.docs) {
            const data = doc.data();
            if ((data.email || '').toLowerCase() === email.toLowerCase()) {
                targetUser = { id: doc.id, ...data };
                break;
            }
        }

        // Use the owner's project ref (not the invitee's)
        const collabRef = getCollabRef(ownerId, projectId);

        // Assign a stable color
        const existingSnap = await collabRef.get();
        const usedColors = existingSnap.docs.map(d => d.data().color).filter(Boolean);
        const color = COLLAB_COLORS.find(c => !usedColors.includes(c)) || COLLAB_COLORS[existingSnap.size % COLLAB_COLORS.length];

        const collabData = {
            email: email.toLowerCase(),
            permission,
            status: targetUser ? 'active' : 'pending',
            userId: targetUser?.id || null,
            displayName: targetUser?.displayName || targetUser?.username || email.split('@')[0],
            color,
            invitedAt: new Date().toISOString(),
            invitedBy: ownerId,
        };

        // Use email as doc ID (sanitized)
        const docId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await collabRef.doc(docId).set(collabData, { merge: true });

        // Fetch project title to include in email
        let projectTitle = 'Untitled Project';
        try {
            const projectSnap = await db.collection('user').doc('roles')
                .collection('client').doc(ownerId)
                .collection('projects').doc(projectId).get();
            if (projectSnap.exists) {
                projectTitle = projectSnap.data().title || projectSnap.data().name || projectTitle;
            }
        } catch (pErr) {
            console.warn('[Collab] Could not fetch project title:', pErr.message);
        }

        // Send email invite using emailService (uses GMAIL_USER/GMAIL_APP_PASSWORD)
        try {
            await sendCollaborationInviteEmail({
                to: email,
                fromName: req.user.displayName || req.user.username || 'A collaborator',
                projectId,
                projectTitle,
                permission
            });
        } catch (emailErr) {
            console.warn('[Collab] Email send failed:', emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: `Invitation sent to ${email}`,
            collaborator: { id: docId, ...collabData },
        });
    } catch (err) {
        console.error('[collaborationController.invite]', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc   List collaborators for a project
// @route  GET /api/collaboration/:projectId/collaborators
// @access Private
exports.list = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();
        const { projectId } = req.params;

        // Resolve actual owner (supports collaborators viewing the list)
        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        const ownerId = resolved ? resolved.ownerId : userId;

        const collabRef = getCollabRef(ownerId, projectId);
        const snap = await collabRef.get();
        const collaborators = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        res.status(200).json({ success: true, collaborators });
    } catch (err) {
        console.error('[collaborationController.list]', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc   Update collaborator permission
// @route  PATCH /api/collaboration/:projectId/collaborators/:collabId
// @access Private (project owner only)
exports.updatePermission = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();
        const { projectId, collabId } = req.params;
        const { permission } = req.body || {};

        console.log(`[Collab] Update permission request by user ${userId} for collab ${collabId} in project ${projectId}`);

        const allowed = ['viewer', 'editor'];
        if (!allowed.includes(permission)) {
            return res.status(400).json({ success: false, message: 'Invalid permission.' });
        }

        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        console.log(`[Collab] Update perm - Resolved permission for requester ${userId}:`, resolved);

        if (!resolved || resolved.permission !== 'owner') {
            console.log(`[Collab] Denied: permission is ${resolved?.permission}`);
            return res.status(403).json({ success: false, message: 'Only the project owner can change permissions.' });
        }
        const ownerId = resolved.ownerId;

        const collabRef = getCollabRef(ownerId, projectId).doc(collabId);
        const collabDoc = await collabRef.get();
        if (!collabDoc.exists) {
            return res.status(404).json({ success: false, message: 'Collaborator not found.' });
        }

        await collabRef.update({ permission });

        res.status(200).json({ success: true, message: 'Permission updated.' });
    } catch (err) {
        console.error('[collaborationController.updatePermission]', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc   Remove a collaborator
// @route  DELETE /api/collaboration/:projectId/collaborators/:collabId
// @access Private (project owner only)
exports.remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();
        const { projectId, collabId } = req.params;

        console.log(`[Collab] Remove request by user ${userId} for collab ${collabId} in project ${projectId}`);

        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        console.log(`[Collab] Remove - Resolved permission for requester ${userId}:`, resolved);

        if (!resolved) {
            return res.status(403).json({ success: false, message: 'You do not have access to this project.' });
        }

        const ownerId = resolved.ownerId;
        const isOwner = resolved.permission === 'owner';

        // Find if this collabId belongs to the current user
        const collabDoc = await getCollabRef(ownerId, projectId).doc(collabId).get();
        if (!collabDoc.exists) {
            return res.status(404).json({ success: false, message: 'Collaborator not found.' });
        }

        const collabData = collabDoc.data();
        const isSelf = collabData.userId === userId || collabData.email.toLowerCase() === userEmail.toLowerCase();

        if (!isOwner && !isSelf) {
            console.log(`[Collab] Denied remove: not owner and not self.`);
            return res.status(403).json({ success: false, message: 'Only the project owner can remove others. You can only remove yourself.' });
        }

        console.log(`[Collab] Deleting collaborator ${collabId} from owner ${ownerId} project ${projectId}. Reason: ${isOwner ? 'Owner action' : 'Self removal'}`);
        await getCollabRef(ownerId, projectId).doc(collabId).delete();

        res.status(200).json({ success: true, message: 'Collaborator removed.' });
    } catch (err) {
        console.error('[collaborationController.remove]', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// @desc   Get projects shared with the current user
// @route  GET /api/collaboration/shared-with-me
// @access Private
exports.sharedWithMe = async (req, res) => {
    try {
        const userEmail = (req.user.email || '').toLowerCase();
        const userId = req.user.id;

        // Scan all clients' collaborators collections for this user's email
        const clientsSnap = await db.collection('user').doc('roles').collection('client').get();
        const sharedProjects = [];

        for (const clientDoc of clientsSnap.docs) {
            const ownerId = clientDoc.id;
            if (ownerId === userId) continue; // Skip own projects

            const projectsSnap = await clientDoc.ref.collection('projects').get();
            for (const projectDoc of projectsSnap.docs) {
                const collabSnap = await projectDoc.ref.collection('collaborators').get();
                for (const collabDoc of collabSnap.docs) {
                    const data = collabDoc.data();
                    const matchEmail = (data.email || '').toLowerCase() === userEmail;
                    const matchId = data.userId === userId;
                    if (matchEmail || matchId) {
                        const projectData = projectDoc.data();
                        sharedProjects.push({
                            projectId: projectDoc.id,
                            ownerId,
                            ownerName: clientDoc.data()?.displayName || clientDoc.data()?.username || 'Unknown',
                            ...projectData,
                            myPermission: data.permission,
                            myColor: data.color,
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, projects: sharedProjects });
    } catch (err) {
        console.error('[collaborationController.sharedWithMe]', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

