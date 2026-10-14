const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const embeddedDb = require('./embeddedDb');

let pgPool = null;
let isPgAvailable = false;
let hasCheckedPg = false;

try {
    pgPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'veronic',
        database: process.env.DB_NAME || 'manufacturing_db',
        connectionTimeoutMillis: 1500,
    });

    pgPool.on('error', (err) => {
        console.warn('PostgreSQL client notice:', err.message);
        isPgAvailable = false;
    });

    // Check PostgreSQL connection in background
    pgPool.query('SELECT 1').then(() => {
        isPgAvailable = true;
        hasCheckedPg = true;
        console.log(`✅ PostgreSQL connected successfully to: ${process.env.DB_NAME || 'manufacturing_db'}`);
    }).catch(err => {
        isPgAvailable = false;
        hasCheckedPg = true;
        console.log(`⚡ PostgreSQL not running on localhost (${err.message}). Using Embedded Local Database & Cloud Firestore.`);
    });
} catch (err) {
    isPgAvailable = false;
    hasCheckedPg = true;
    console.log(`⚡ PostgreSQL init skipped. Using Embedded Database.`);
}

// Unified query executor
async function query(text, params = []) {
    // If PostgreSQL is verified available, try PG first
    if (isPgAvailable && pgPool) {
        try {
            return await pgPool.query(text, params);
        } catch (pgErr) {
            const isConnErr = ['ECONNREFUSED', 'ETIMEDOUT', '57P01', '28P01', '3D000'].includes(pgErr.code) ||
                              pgErr.message.includes('ECONNREFUSED') ||
                              pgErr.message.includes('password authentication failed') ||
                              pgErr.message.includes('Connection terminated');
            if (isConnErr) {
                isPgAvailable = false;
                console.warn('⚠️ Switching to Embedded Database due to connection issue:', pgErr.message);
                return await embeddedDb.runEmbeddedQuery(text, params);
            }
            throw pgErr;
        }
    }

    // Default to embedded database engine
    return await embeddedDb.runEmbeddedQuery(text, params);
}

// Emulate pg Pool interface
const unifiedPool = {
    query,
    on: () => unifiedPool,
    connect: async () => ({
        query,
        release: () => {}
    }),
    end: async () => {
        if (pgPool) {
            try { await pgPool.end(); } catch (e) {}
        }
    },
    isPostgresConnected: () => isPgAvailable,
    embeddedDb
};

module.exports = unifiedPool;