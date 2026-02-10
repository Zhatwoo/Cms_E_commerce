const crypto = require('crypto');
const { db } = require('../config/firebase');

const COLLECTION = 'password_resets';
const EXPIRY_HOURS = 1;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function create(userId, email) {
  const token = generateToken();
  const expires_at = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);
  const doc = {
    user_id: userId,
    email: email.toLowerCase(),
    token,
    expires_at,
    created_at: new Date(),
  };
  const ref = await db.collection(COLLECTION).add(doc);
  return { token, docId: ref.id };
}

async function findByToken(token) {
  const snap = await db.collection(COLLECTION).where('token', '==', token).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  const doc = snap.docs[0];
  return {
    id: doc.id,
    userId: d.user_id,
    email: d.email,
    token: d.token,
    expiresAt: d.expires_at?.toDate?.()?.toISOString?.() || d.expires_at,
    createdAt: d.created_at?.toDate?.()?.toISOString?.() || d.created_at,
  };
}

async function deleteByDocId(docId) {
  await db.collection(COLLECTION).doc(docId).delete();
}

module.exports = { create, findByToken, deleteByDocId, EXPIRY_HOURS };
