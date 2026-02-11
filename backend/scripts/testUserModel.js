const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');
        }
    });
}

const User = require('../models/User');

async function testUserModel() {
    console.log('🚀 Testing User model with nested paths...');

    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'password123';
    const testName = 'Test User';

    try {
        // 1. Test Register
        console.log(`Step 1: Registering user ${testEmail}...`);
        const user = await User.register({ name: testName, email: testEmail, password: testPassword });
        console.log('✅ Registration successful.');
        console.log('User data:', user);

        if (user.role !== 'client') {
            console.error('❌ Role is not client!');
        }

        // 2. Test findById
        console.log(`Step 2: Testing findById(${user.id})...`);
        const foundById = await User.findById(user.id);
        if (foundById && foundById.email === testEmail) {
            console.log('✅ findById successful.');
        } else {
            console.error('❌ findById failed or returned wrong user.');
        }

        // 3. Test findByEmail
        console.log(`Step 3: Testing findByEmail(${testEmail})...`);
        const foundByEmail = await User.findByEmail(testEmail);
        if (foundByEmail && foundByEmail.id === user.id) {
            console.log('✅ findByEmail successful.');
        } else {
            console.error('❌ findByEmail failed.');
        }

        // 4. Test Update
        console.log('Step 4: Testing update...');
        const updated = await User.update(user.id, { name: 'Updated Name' });
        if (updated.fullName === 'Updated Name') {
            console.log('✅ update successful.');
        } else {
            console.error('❌ update failed.');
        }

        // 5. Test findAll
        console.log('Step 5: Testing findAll...');
        const all = await User.findAll({ search: 'Updated' });
        if (all.some(u => u.id === user.id)) {
            console.log('✅ findAll successful.');
        } else {
            console.error('❌ findAll failed.');
        }

        // Cleanup
        console.log('🧹 Cleaning up...');
        await User.delete(user.id);
        console.log('✅ Cleanup complete.');

    } catch (error) {
        console.error('❌ User model test failed:', error.stack);
    }
}

testUserModel();
