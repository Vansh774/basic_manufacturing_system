const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db = null;
let isInitialized = false;

try {
    const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        }
        db = admin.firestore();
        isInitialized = true;
        console.log(`🔥 Firebase Admin connected to project: ${serviceAccount.project_id}`);
    } else {
        console.warn('⚠️ Firebase serviceAccountKey.json not found in config directory.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
}

module.exports = {
    admin,
    db,
    isInitialized: () => isInitialized,
    getFirestore: () => db
};
