// config/env.js - Validate required environment variables at startup
const required = [
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const optional = ['FIREBASE_DATABASE_URL', 'PORT', 'NODE_ENV'];

const validateEnv = () => {
  const missing = required.filter(key => {
    const val = process.env[key];
    if (val === undefined || val === '') return true;
    if (key === 'FIREBASE_PRIVATE_KEY' && typeof val === 'string' && val.trim() === '') return true;
    return false;
  });
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    required.forEach(key => {
      const val = process.env[key];
      const status = val === undefined ? 'undefined' : (val === '' ? 'empty' : `set (length ${String(val).length})`);
      console.error(`   ${key}: ${status}`);
    });
    process.exit(1);
  }
  return true;
};

module.exports = { validateEnv };
