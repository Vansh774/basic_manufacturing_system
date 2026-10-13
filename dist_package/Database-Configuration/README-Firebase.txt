========================================================================
     MANUFACTURING MANAGEMENT SYSTEM - FIREBASE FIRESTORE CLOUD GUIDE
========================================================================

Project ID:     manufacturing-3cfa6
Database:       Cloud Firestore
Service Account: firebase-adminsdk-fbsvc@manufacturing-3cfa6.iam.gserviceaccount.com
Client Web App:  1:591965932735:web:6df6170c0a48dabda90a0a

------------------------------------------------------------------------
1. SYNCED COLLECTIONS (TABLES) IN FIREBASE FIRESTORE
------------------------------------------------------------------------
All PostgreSQL tables are fully mapped to Cloud Firestore collections:

1. users                   (5 documents)
   - Columns: id, email, password, name, role, shift, assigned_machines, created_at, updated_at
   - Demo accounts: owner@factory.com, manager@factory.com, operator1@factory.com, etc.

2. machines                (22 documents)
   - Columns: id, machine_code, name, status, current_product, current_operator_id,
     production_rate_per_hour, current_downtime_reason, downtime_start_time, is_running

3. products                (6 documents)
   - Columns: id, name, sku, description, target_per_shift, created_at

4. production_entries      (450 documents)
   - Columns: id, machine_id, product_id, operator_id, shift, date, quantity, approved_by

5. downtime_entries        (22 documents)
   - Columns: id, machine_id, reported_by, start_time, end_time, duration, reason, status

6. machine_loss_tracking   (20 documents)
   - Columns: id, machine_id, date, loss_quantity, loss_amount, downtime_minutes, reason

7. system_settings         (7 documents)
   - Columns: id, setting_key, setting_value, description, updated_by, updated_at

8. downtime_reasons        (10 documents)
   - Columns: id, name, category, is_active

Total Synced Documents: 542 records across 8 collections.

------------------------------------------------------------------------
2. HOW TO SYNC POSTGRESQL TO FIREBASE AGAIN
------------------------------------------------------------------------
- On Windows:
  Double-click "Database-Configuration/sync-to-firebase.bat"
  or run from Backend: node scripts/syncToFirebase.js

- From the Web App:
  Click the "🔥 Firebase: Connected" badge in the top navbar of the Owner
  or Manager dashboard, and click "🔄 Sync All Tables to Firebase".

- Via REST API:
  GET  http://localhost:5000/api/firebase/status  (Check collection doc counts)
  POST http://localhost:5000/api/firebase/sync    (Trigger live cloud sync)

========================================================================
