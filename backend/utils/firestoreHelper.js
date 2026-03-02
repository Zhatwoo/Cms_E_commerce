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

/**
 * Helper to recursively delete a document and ALL its sub-collections.
 * Firestore doesn't do this automatically.
 */
async function deleteRecursive(docRef) {
  const collections = await docRef.listCollections();
  for (const collection of collections) {
    const documents = await collection.get();
    for (const doc of documents.docs) {
      await deleteRecursive(doc.ref);
    }
  }
  await docRef.delete();
}

module.exports = { docToObject, deleteRecursive };
