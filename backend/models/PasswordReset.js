// models/PasswordReset.js - Firestore collection for password reset tokens
const crypto = require('crypto');
const { getFirestore } = require('../config/firebase');

const COLLECTION = 'passwordResets';
const EXPIRY_HOURS = 1;

function getCollection() {
  return getFirestore().collection(COLLECTION);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function create(userId, email) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const data = {
    userId,
    email: email.toLowerCase(),
    token,
    expiresAt,
    createdAt: new Date().toISOString()
  };
  const docRef = await getCollection().add(data);
  return { token, docId: docRef.id };
}

async function findByToken(token) {
  const snapshot = await getCollection().where('token', '==', token).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function deleteByDocId(docId) {
  await getCollection().doc(docId).delete();
}

module.exports = {
  create,
  findByToken,
  deleteByDocId,
  EXPIRY_HOURS
};
