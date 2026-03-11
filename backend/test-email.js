require('dotenv').config();
const { sendCollaborationInviteEmail } = require('./utils/emailService');

async function test() {
    console.log('Testing email send...');
    const res = await sendCollaborationInviteEmail({
        to: 'backupboom4@gmail.com',
        fromName: 'Test User',
        projectId: 'test-project',
        projectTitle: 'Test Project',
        permission: 'editor'
    });
    console.log('Result:', res);
}

test();
