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
  const expiresRaw = d.expires_at || d.expiresAt || null;
  const createdRaw = d.created_at || d.createdAt || null;
  return {
    id: doc.id,
    userId: d.user_id || d.userId || null,
    email: d.email || d.user_email || '',
    token: d.token,
    expiresAt: expiresRaw?.toDate?.()?.toISOString?.() || expiresRaw,
    createdAt: createdRaw?.toDate?.()?.toISOString?.() || createdRaw,
  };
}

async function deleteByDocId(docId) {
  await db.collection(COLLECTION).doc(docId).delete();
}

module.exports = { create, findByToken, deleteByDocId, EXPIRY_HOURS };
