const express = require('express');
const router = express.Router();
const { db, isInitialized } = require('../config/firebase');
const pool = require('../config/db');

// Check Firebase status and collections count
router.get('/status', async (req, res) => {
    try {
        if (!isInitialized() || !db) {
            return res.json({
                connected: false,
                message: 'Firebase is not initialized'
            });
        }

        const collections = [
            'users',
            'machines',
            'products',
            'production_entries',
            'downtime_entries',
            'machine_loss_tracking',
            'system_settings',
            'downtime_reasons'
        ];

        const counts = {};
        for (const name of collections) {
            const snap = await db.collection(name).get();
            counts[name] = snap.size;
        }

        res.json({
            connected: true,
            projectId: 'manufacturing-3cfa6',
            database: 'Cloud Firestore',
            collections: counts,
            totalDocuments: Object.values(counts).reduce((a, b) => a + b, 0),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Firebase status error:', error);
        res.status(500).json({ connected: false, error: error.message });
    }
});

// Trigger sync from PostgreSQL to Firebase
router.post('/sync', async (req, res) => {
    try {
        if (!isInitialized() || !db) {
            return res.status(500).json({ success: false, message: 'Firebase is not initialized' });
        }

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
        const results = {};

        for (const table of tables) {
            const pgRes = await pool.query(`SELECT * FROM ${table.name}`);
            const rows = pgRes.rows;
            const BATCH_SIZE = 400;

            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                const batch = db.batch();
                const chunk = rows.slice(i, i + BATCH_SIZE);

                for (const row of chunk) {
                    const docId = String(row[table.idKey] || (i + 1));
                    const docRef = db.collection(table.name).doc(docId);
                    
                    const clean = {};
                    for (const [k, v] of Object.entries(row)) {
                        clean[k] = (v instanceof Date) ? v.toISOString() : v;
                    }
                    batch.set(docRef, clean, { merge: true });
                    totalSynced++;
                }
                await batch.commit();
            }
            results[table.name] = rows.length;
        }

        res.json({
            success: true,
            message: 'All tables synced to Firebase successfully!',
            syncedTables: results,
            totalDocuments: totalSynced
        });
    } catch (error) {
        console.error('Firebase sync error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
