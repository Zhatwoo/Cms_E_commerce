require('dotenv').config();
const { db } = require('./config/firebase');

async function checkComments(projectId) {
    console.log(`Checking comments for project: ${projectId}`);

    // Find who owns this project
    const clientsSnap = await db.collection('user').doc('roles').collection('client').get();
    console.log(`Found ${clientsSnap.size} clients.`);

    for (const clientDoc of clientsSnap.docs) {
        const projSnap = await clientDoc.ref.collection('projects').doc(projectId).get();
        if (projSnap.exists) {
            const ownerId = clientDoc.id;
            console.log(`Project ${projectId} is owned by: ${ownerId}`);

            const commentsSnap = await projSnap.ref.collection('comments').get();
            console.log(`Project has ${commentsSnap.size} comments.`);

            commentsSnap.forEach(doc => {
                const data = doc.data();
                console.log(`- Comment ${doc.id}: Author ${data.authorName} (${data.authorId}), Content: "${data.content}", Created: ${data.createdAt}`);
            });
            return;
        }
    }
    console.log(`Project ${projectId} not found.`);
}

const projId = process.argv[2] || 'yCwus2xybdJzkJK8oBlJ';
checkComments(projId).catch(console.error);
