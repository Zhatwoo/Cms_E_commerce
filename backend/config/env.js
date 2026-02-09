// config/env.js - Validate required environment variables at startup
const required = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const optional = ['PORT', 'NODE_ENV'];

const validateEnv = () => {
  const missing = required.filter(key => {
    const val = process.env[key];
    return val === undefined || val === '';
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
