// seed_message.js
const path = require('path');
const fs = require('fs');

// Simple .env loader similar to server.js
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/'(.*)'$/, '$1').replace(/\\n/g, '\n');
    }
  });
}

const { db } = require('./config/firebase');

async function seed() {
  try {
    const docRef = await db.collection('messages').add({
      sender_id: 'system',
      sender_name: 'Antigravity AI',
      sender_avatar: null,
      message: 'Welcome to the new Admin Messaging Hub! You can now receive support inquiries, admin chats, and internal requests here.',
      type: 'internal',
      status: 'unread',
      website_id: null,
      created_at: new Date()
    });
    console.log('Message seeded with ID:', docRef.id);
  } catch (e) {
    console.error('Seed failed:', e.message);
  }
  process.exit(0);
}

seed();
