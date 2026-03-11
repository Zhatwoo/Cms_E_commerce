const { db } = require('../config/firebase');
const { resolveProjectOwner } = require('../utils/resolveProjectOwner');

/**
 * Get the reference to the comments collection for a project
 */
function getCommentsRef(ownerId, projectId) {
    return db.collection('user').doc('roles')
        .collection('client').doc(ownerId)
        .collection('projects').doc(projectId)
        .collection('comments');
}

// @desc   Add a comment to a project
// @route  POST /api/projects/:projectId/comments
// @access Private
exports.add = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { content, x, y, pageId, authorName, authorEmail, color, authorAvatar } = req.body;
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();

        // 1. Resolve project owner & check access
        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        if (!resolved) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const commentsRef = getCommentsRef(resolved.ownerId, projectId);

        const commentData = {
            content,
            x: parseFloat(x) || 0,
            y: parseFloat(y) || 0,
            pageId: pageId || 'ROOT',
            authorId: userId,
            authorName: authorName || req.user.displayName || 'Contributor',
            authorEmail: authorEmail || userEmail,
            authorAvatar: authorAvatar || null,
            color: color || '#6c8fff',
            resolved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await commentsRef.add(commentData);

        res.status(201).json({
            success: true,
            comment: { id: docRef.id, ...commentData }
        });
    } catch (error) {
        console.error('[Comments] Add failed:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc   List all comments for a project
// @route  GET /api/projects/:projectId/comments
// @access Private
exports.list = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();

        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        if (!resolved) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const commentsRef = getCommentsRef(resolved.ownerId, projectId);
        const snapshot = await commentsRef.orderBy('createdAt', 'desc').get();

        const comments = [];
        snapshot.forEach(doc => {
            comments.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error('[Comments] List failed:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc   Set comment resolved status
// @route  PATCH /api/projects/:projectId/comments/:commentId/resolve
// @access Private
exports.resolve = async (req, res) => {
    try {
        const projectId = (req.params.projectId || '').trim();
        const commentId = (req.params.commentId || '').trim();
        const { resolved: resolvedStatus } = req.body;
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();

        if (!projectId || !commentId) {
            return res.status(400).json({ success: false, message: 'Project ID and Comment ID are required' });
        }

        console.log(`[Comments] Resolve attempt - Project: "${projectId}", Comment: "${commentId}", User: "${userId}", Status: ${resolvedStatus}`);

        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        if (!resolved) {
            console.error(`[Comments] Resolve failed: Access denied for project "${projectId}"`);
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const commentsRef = getCommentsRef(resolved.ownerId, projectId);
        const commentDoc = await commentsRef.doc(commentId).get();

        if (!commentDoc.exists) {
            console.error(`[Comments] Resolve failed: Comment "${commentId}" not found in project "${projectId}"`);
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        await commentDoc.ref.update({
            resolved: !!resolvedStatus,
            updatedAt: new Date().toISOString()
        });

        console.log(`[Comments] Successfully updated comment "${commentId}" (Resolved: ${resolvedStatus})`);
        res.status(200).json({ success: true, message: 'Comment status updated' });
    } catch (error) {
        console.error('[Comments] Resolve failed:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc   Delete a comment
// @route  DELETE /api/projects/:projectId/comments/:commentId
// @access Private (Owner or Author only)
exports.remove = async (req, res) => {
    try {
        const projectId = (req.params.projectId || '').trim();
        const commentId = (req.params.commentId || '').trim();
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase();

        if (!projectId || !commentId) {
            return res.status(400).json({ success: false, message: 'Project ID and Comment ID are required' });
        }

        console.log(`[Comments] Delete attempt - Project: "${projectId}", Comment: "${commentId}", User: "${userId}"`);

        const resolved = await resolveProjectOwner(userId, projectId, userEmail);
        if (!resolved) {
            console.error(`[Comments] Delete failed: Access denied for project "${projectId}"`);
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        console.log(`[Comments] Resolved owner for project "${projectId}": ${resolved.ownerId}`);

        const commentDoc = await getCommentsRef(resolved.ownerId, projectId).doc(commentId).get();
        if (!commentDoc.exists) {
            console.error(`[Comments] Delete failed: Comment "${commentId}" not found in project "${projectId}" (Owner: ${resolved.ownerId})`);
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const data = commentDoc.data();
        if (data.authorId !== userId && resolved.permission !== 'owner') {
            console.error(`[Comments] Delete failed: User "${userId}" not authorized to delete comment "${commentId}" (Author: ${data.authorId}, Owner: ${resolved.ownerId})`);
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        await commentDoc.ref.delete();
        console.log(`[Comments] Successfully deleted comment "${commentId}" from project "${projectId}"`);
        res.status(200).json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        console.error('[Comments] Delete failed:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
