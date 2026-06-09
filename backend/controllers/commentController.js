const { db } = require('../config/firebase');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');
const { v4: uuidv4 } = require('uuid');
const log = require('../utils/logger')('commentController');

function getCommentsRef(ownerId, projectId) {
    return db.collection('user').doc('roles')
        .collection('client').doc(ownerId)
        .collection('projects').doc(projectId)
        .collection('comments');
}

async function resolveAccess(req, res) {
    const projectId = (req.params.projectId || '').trim();
    const userId = req.user.id;
    const userEmail = (req.user.email || '').toLowerCase();
    const resolved = await resolveProjectOwner(userId, projectId, userEmail);
    if (!resolved) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return null;
    }
    return { projectId, userId, userEmail, resolved };
}

// ── Comments ─────────────────────────────────────────────────────────────────

// POST /api/projects/:projectId/comments
exports.add = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const { content, x, y, pageId, authorName, authorEmail, color, authorAvatar } = req.body;

        const commentData = {
            content,
            x: parseFloat(x) || 0,
            y: parseFloat(y) || 0,
            pageId: pageId || 'ROOT',
            authorId: ctx.userId,
            authorName: authorName || req.user.name || 'Contributor',
            authorEmail: authorEmail || ctx.userEmail,
            authorAvatar: authorAvatar || null,
            color: color || '#6c8fff',
            resolved: false,
            replies: [],
            reactions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await getCommentsRef(ctx.resolved.ownerId, ctx.projectId).add(commentData);
        res.status(201).json({ success: true, comment: { id: docRef.id, ...commentData } });
    } catch (err) {
        log.error('[Comments] Add failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/projects/:projectId/comments
exports.list = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;

        const snapshot = await getCommentsRef(ctx.resolved.ownerId, ctx.projectId)
            .orderBy('createdAt', 'desc').get();

        const comments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            comments.push({
                id: doc.id,
                ...data,
                replies: data.replies || [],
                reactions: data.reactions || [],
            });
        });

        res.status(200).json({ success: true, comments });
    } catch (err) {
        log.error('[Comments] List failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/projects/:projectId/comments/:commentId
exports.update = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const { content } = req.body;

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        await ref.update({ content, updatedAt: new Date().toISOString() });
        res.status(200).json({ success: true });
    } catch (err) {
        log.error('[Comments] Update failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/projects/:projectId/comments/:commentId/position
exports.move = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const { x, y } = req.body;

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        await ref.update({ x: parseFloat(x) || 0, y: parseFloat(y) || 0, updatedAt: new Date().toISOString() });
        res.status(200).json({ success: true });
    } catch (err) {
        log.error('[Comments] Move failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/projects/:projectId/comments/:commentId/resolve
exports.resolve = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const { resolved: resolvedStatus } = req.body;

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        await ref.update({ resolved: !!resolvedStatus, updatedAt: new Date().toISOString() });
        res.status(200).json({ success: true });
    } catch (err) {
        log.error('[Comments] Resolve failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/projects/:projectId/comments/:commentId
exports.remove = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        const data = doc.data();
        if (data.authorId !== ctx.userId && ctx.resolved.permission !== 'owner') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await ref.delete();
        res.status(200).json({ success: true });
    } catch (err) {
        log.error('[Comments] Delete failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── Replies ───────────────────────────────────────────────────────────────────

// POST /api/projects/:projectId/comments/:commentId/replies
exports.addReply = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        const reply = {
            id: uuidv4(),
            commentId,
            content: content.trim(),
            authorId: ctx.userId,
            authorName: req.user.name || 'Contributor',
            authorEmail: ctx.userEmail,
            authorAvatar: req.user.avatar || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const existing = doc.data().replies || [];
        await ref.update({
            replies: [...existing, reply],
            updatedAt: new Date().toISOString(),
        });

        res.status(201).json({ success: true, reply });
    } catch (err) {
        log.error('[Comments] Add reply failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/projects/:projectId/comments/:commentId/replies/:replyId
exports.deleteReply = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const replyId = (req.params.replyId || '').trim();

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        const replies = (doc.data().replies || []).filter(r => r.id !== replyId);
        await ref.update({ replies, updatedAt: new Date().toISOString() });

        res.status(200).json({ success: true });
    } catch (err) {
        log.error('[Comments] Delete reply failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── Reactions ─────────────────────────────────────────────────────────────────

// POST /api/projects/:projectId/comments/:commentId/reactions
exports.addReaction = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const { emoji } = req.body;

        if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        const reactions = doc.data().reactions || [];
        // Prevent duplicate reaction from same user+emoji
        const alreadyReacted = reactions.some(r => r.emoji === emoji && r.userId === ctx.userId);
        if (alreadyReacted) {
            return res.status(200).json({ success: true, reaction: reactions.find(r => r.emoji === emoji && r.userId === ctx.userId) });
        }

        const reaction = {
            emoji,
            userId: ctx.userId,
            userName: req.user.name || 'Contributor',
        };

        await ref.update({
            reactions: [...reactions, reaction],
            updatedAt: new Date().toISOString(),
        });

        res.status(201).json({ success: true, reaction });
    } catch (err) {
        log.error('[Comments] Add reaction failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/projects/:projectId/comments/:commentId/reactions
exports.removeReaction = async (req, res) => {
    try {
        const ctx = await resolveAccess(req, res);
        if (!ctx) return;
        const commentId = (req.params.commentId || '').trim();
        const { emoji } = req.body;

        const ref = getCommentsRef(ctx.resolved.ownerId, ctx.projectId).doc(commentId);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Comment not found' });

        const reactions = (doc.data().reactions || []).filter(
            r => !(r.emoji === emoji && r.userId === ctx.userId)
        );
        await ref.update({ reactions, updatedAt: new Date().toISOString() });

        res.status(200).json({ success: true, userId: ctx.userId });
    } catch (err) {
        log.error('[Comments] Remove reaction failed:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
