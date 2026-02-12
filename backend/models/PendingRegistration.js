const crypto = require('crypto');
const { db } = require('../config/firebase');

const COLLECTION = 'pending_registrations';
const EXPIRY_HOURS = 24;
const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const SALT = 'pending-reg-v1';

function getKey() {
  const secret = process.env.JWT_SECRET || process.env.PENDING_REGISTRATION_SECRET || 'default-dev-secret';
  return crypto.scryptSync(secret, SALT, 32);
}

function encrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

function decrypt(cipherText) {
  const key = getKey();
  const buf = Buffer.from(cipherText, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const authTag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const enc = buf.subarray(IV_LEN + AUTH_TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(enc) + decipher.final('utf8');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create pending registration. User is NOT in Firebase until they confirm email.
 * @returns {{ token, docId }}
 */
async function create({ email, name, password }) {
  const token = generateToken();
  const expires_at = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);
  const doc = {
    email: email.toLowerCase().trim(),
    full_name: (name || '').trim(),
    password_enc: encrypt(password),
    token,
    expires_at,
    created_at: new Date(),
  };
  const ref = await db.collection(COLLECTION).add(doc);
  return { token, docId: ref.id };
}

/**
 * Find pending registration by token. Returns plain password in .password.
 */
async function findByToken(token) {
  const snap = await db.collection(COLLECTION).where('token', '==', token).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  const doc = snap.docs[0];
  let password = '';
  try {
    password = decrypt(d.password_enc);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('PendingRegistration decrypt error:', e.message);
    return null;
  }
  return {
    id: doc.id,
    email: d.email,
    name: d.full_name || d.email?.split('@')[0] || '',
    password,
    expiresAt: d.expires_at?.toDate?.()?.toISOString?.() || d.expires_at,
    createdAt: d.created_at?.toDate?.()?.toISOString?.() || d.created_at,
  };
}

async function deleteByDocId(docId) {
  await db.collection(COLLECTION).doc(docId).delete();
}

/** Check if email already has a pending registration (to avoid duplicates). */
async function findByEmail(email) {
  const norm = (email || '').toLowerCase().trim();
  const snap = await db.collection(COLLECTION).where('email', '==', norm).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

module.exports = { create, findByToken, deleteByDocId, findByEmail, EXPIRY_HOURS };
