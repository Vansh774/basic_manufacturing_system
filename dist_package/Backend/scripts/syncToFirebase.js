const admin = require('firebase-admin');
const pool = require('../src/config/db');
const serviceAccount = require('../src/config/serviceAccountKey.json');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}

const firestore = admin.firestore();

// Helper to convert date objects to ISO strings
function sanitizeRow(row) {
    const clean = {};
    for (const [key, value] of Object.entries(row)) {
        if (value instanceof Date) {
            clean[key] = value.toISOString();
        } else if (value === null || value === undefined) {
            clean[key] = null;
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

async function syncTableToFirestore(tableName, idKey = 'id') {
    try {
        console.log(`\n📦 Syncing table: "${tableName}" to Firestore collection...`);
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        const rows = result.rows;
        console.log(`   Found ${rows.length} records in PostgreSQL table "${tableName}".`);

        if (rows.length === 0) {
            console.log(`   No records to sync for "${tableName}".`);
            return 0;
        }

        // Firestore batch max size is 500
        const BATCH_SIZE = 400;
        let syncedCount = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = firestore.batch();
            const chunk = rows.slice(i, i + BATCH_SIZE);

            for (const row of chunk) {
                const docId = String(row[idKey] || (i + 1));
                const docRef = firestore.collection(tableName).doc(docId);
                const sanitized = sanitizeRow(row);
                batch.set(docRef, sanitized, { merge: true });
                syncedCount++;
            }

            await batch.commit();
            console.log(`   ✓ Committed batch: ${syncedCount}/${rows.length} documents.`);
        }

        console.log(`✅ Table "${tableName}" successfully synced to Firestore (${syncedCount} docs).`);
        return syncedCount;
    } catch (error) {
        console.error(`❌ Error syncing table "${tableName}":`, error.message);
        throw error;
    }
}

async function syncAllTables() {
    console.log("==========================================================");
    console.log("   SYNCING ALL POSTGRESQL TABLES TO FIREBASE FIRESTORE    ");
    console.log("==========================================================");
    console.log(`Firebase Project: ${serviceAccount.project_id}`);

    const tables = [
        { name: 'users', idKey: 'id' },
        { name: 'machines', idKey: 'id' },
        { name: 'products', idKey: 'id' },
        { name: 'production_entries', idKey: 'id' },
        { name: 'downtime_entries', idKey: 'id' },
        { name: 'machine_loss_tracking', idKey: 'id' },
        { name: 'system_settings', idKey: 'setting_key' },
        { name: 'downtime_reasons', idKey: 'id' }
    ];

    let totalSynced = 0;
    for (const table of tables) {
        try {
            const count = await syncTableToFirestore(table.name, table.idKey);
            totalSynced += count;
        } catch (err) {
            console.error(`Failed to sync ${table.name}, continuing...`);
        }
    }

    console.log("\n==========================================================");
    console.log(`🎉 ALL TABLES SYNCED SUCCESSFULLY! Total documents: ${totalSynced}`);
    console.log("==========================================================");

    process.exit(0);
}

syncAllTables().catch((err) => {
    console.error("Sync script fatal error:", err);
    process.exit(1);
});
