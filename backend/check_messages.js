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
  const snap = await db.collection('messages').get();
  console.log(`Total messages: ${snap.size}`);
  snap.docs.forEach(doc => {
    const d = doc.data();
    if (d.type === 'direct') {
      console.log(`ConvID: ${d.conversation_id} | S: ${d.sender_id} | R: ${d.recipient_id} | Msg: ${d.message.substring(0, 10)}`);
    }
  });
  process.exit(0);
}

check();
