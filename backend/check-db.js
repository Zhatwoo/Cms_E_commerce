require('dotenv').config();
const { db } = require('./config/firebase');

async function checkProject(projectId) {
    console.log(`Checking project: ${projectId}`);

    // Scan all clients for this project ID
    const clientsSnap = await db.collection('user').doc('roles').collection('client').get();

    for (const clientDoc of clientsSnap.docs) {
        const projSnap = await clientDoc.ref.collection('projects').doc(projectId).get();
        if (projSnap.exists) {
            console.log(`MATCH FOUND!`);
            console.log(`Owner UID: ${clientDoc.id}`);
            console.log(`Owner Data:`, clientDoc.data());
            console.log(`Project Title: ${projSnap.data().title || projSnap.data().name}`);

            const collabsSnap = await projSnap.ref.collection('collaborators').get();
            console.log(`Collaborators (${collabsSnap.size}):`);
            collabsSnap.forEach(c => {
                console.log(` - ${c.id}: ${JSON.stringify(c.data())}`);
            });
            return;
        }
    }
    console.log('Project not found in any client collection.');
}

checkProject('yCwus2xybdJzkJK8oBlJ');
