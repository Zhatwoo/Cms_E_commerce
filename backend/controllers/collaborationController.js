// collaborationController.js
// Handles HTTP endpoints for collaboration invites and project sharing
const { db } = require('../config/firebase');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');

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
        const ownerId = req.user.id;
        const { projectId } = req.params;
        const { email, permission = 'editor' } = req.body || {};

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

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

        // Send email invite
        try {
            await sendInviteEmail(email, req.user, projectId, permission);
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
        const ownerId = req.user.id;
        const { projectId, collabId } = req.params;
        const { permission } = req.body || {};

        const allowed = ['viewer', 'editor'];
        if (!allowed.includes(permission)) {
            return res.status(400).json({ success: false, message: 'Invalid permission.' });
        }

        const collabRef = getCollabRef(ownerId, projectId).doc(collabId);
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
        const ownerId = req.user.id;
        const { projectId, collabId } = req.params;

        const collabRef = getCollabRef(ownerId, projectId).doc(collabId);
        await collabRef.delete();

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

// Helper: send email invite
async function sendInviteEmail(toEmail, fromUser, projectId, permission) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) return; // Skip if SMTP not configured

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const fromName = fromUser.name || fromUser.username || fromUser.email || 'A collaborator';
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await transporter.sendMail({
        from: `"Vera Builder" <${smtpUser}>`,
        to: toEmail,
        subject: `${fromName} invited you to collaborate`,
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <h2 style="color: #6c8fff;">You've been invited to collaborate!</h2>
        <p><strong>${fromName}</strong> has invited you to join a project on <strong>Vera Builder</strong> as a <em>${permission}</em>.</p>
        <a href="${appUrl}/design?invite=${projectId}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6c8fff; color: #fff; border-radius: 8px; text-decoration: none;">Open Project</a>
        <p style="margin-top: 24px; color: #888; font-size: 12px;">If you don't have an account yet, create one using this email address to accept the invite.</p>
      </div>
    `
    });
}
