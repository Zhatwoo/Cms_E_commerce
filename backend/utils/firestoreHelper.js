const { keysToCamel } = require('./caseHelper');

/** Firestore doc snapshot → plain object with id and camelCase keys; Timestamps → ISO string */
function docToObject(doc) {
  if (!doc || !doc.exists) return null;
  const d = doc.data();
  const out = { id: doc.id, ...d };
  for (const k of Object.keys(out)) {
    if (out[k] && typeof out[k].toDate === 'function') {
      out[k] = out[k].toDate().toISOString();
    }
  }
  return keysToCamel(out);
}

module.exports = { docToObject };
