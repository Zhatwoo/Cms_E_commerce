const crypto = require('crypto');
const { db } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');

function normalizeSubdomain(subdomain) {
  return String(subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function getUsersRef(subdomain) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) {
    throw new Error('A published subdomain is required');
  }
  return db.collection('published_subdomains').doc(normalized).collection('users');
}

function toAppUser(doc) {
  const data = docToObject(doc);
  if (!data) return null;

  return {
    id: data.id,
    uid: data.id,
    email: data.email || '',
    displayName: data.fullName || data.displayName || '',
    fullName: data.fullName || data.displayName || '',
    avatar: data.avatarUrl || data.avatar || null,
    role: 'site_user',
    status: data.status || 'active',
    isActive: data.isActive !== false,
    subdomain: data.subdomain || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt,
  };
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${hashPassword(password, salt)}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || '').split(':');
  if (!salt || !storedHash) return false;

  const candidateHash = hashPassword(password, salt);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const candidateBuffer = Buffer.from(candidateHash, 'hex');

  if (storedBuffer.length !== candidateBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
}

class PublishedSiteUser {
  static normalizeSubdomain(subdomain) {
    return normalizeSubdomain(subdomain);
  }

  static async get(subdomain, id) {
    const normalized = normalizeSubdomain(subdomain);
    if (!normalized || !id) return null;
    const snap = await getUsersRef(normalized).doc(String(id).trim()).get();
    return toAppUser(snap);
  }

  static async findByEmail(subdomain, email) {
    const normalizedSubdomain = normalizeSubdomain(subdomain);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedSubdomain || !normalizedEmail) return null;

    const snap = await getUsersRef(normalizedSubdomain)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return toAppUser(snap.docs[0]);
  }

  static async create(subdomain, { name, email, password }) {
    const normalizedSubdomain = normalizeSubdomain(subdomain);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedSubdomain || !normalizedEmail || !password) {
      throw new Error('subdomain, email, and password are required');
    }

    const now = new Date();
    const ref = getUsersRef(normalizedSubdomain).doc();
    await ref.set({
      email: normalizedEmail,
      full_name: String(name || '').trim() || normalizedEmail.split('@')[0] || 'User',
      avatar_url: null,
      password_hash: createPasswordHash(password),
      status: 'active',
      is_active: true,
      subdomain: normalizedSubdomain,
      created_at: now,
      updated_at: now,
      last_login_at: now,
    });

    return this.get(normalizedSubdomain, ref.id);
  }

  static async authenticate(subdomain, email, password) {
    const normalizedSubdomain = normalizeSubdomain(subdomain);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedSubdomain || !normalizedEmail || !password) return null;

    const snap = await getUsersRef(normalizedSubdomain)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const raw = doc.data() || {};
    const passwordHash = raw.password_hash || raw.passwordHash || '';
    if (!verifyPassword(password, passwordHash)) {
      return null;
    }

    await doc.ref.update({
      last_login_at: new Date(),
      updated_at: new Date(),
    });

    return this.get(normalizedSubdomain, doc.id);
  }
}

module.exports = PublishedSiteUser;
