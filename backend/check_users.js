const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf8');
content.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) {
    process.env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/'(.*)'$/, '$1').replace(/\\n/g, '\n');
  }
});

const { db } = require('./config/firebase');

async function check() {
  const roles = ['client', 'admin'];
  for (const role of roles) {
    const snap = await db.collection('user').doc('roles').collection(role).get();
    console.log(`Role ${role}: ${snap.size} users`);
    snap.docs.forEach(doc => {
      const d = doc.data();
      console.log(`UID: ${doc.id} | Email: ${d.email} | Name: ${d.full_name}`);
    });
  }
  process.exit(0);
}

check();
