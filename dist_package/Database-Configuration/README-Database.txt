========================================================================
     MANUFACTURING MANAGEMENT SYSTEM - DATABASE CONFIGURATION GUIDE
========================================================================

Database Engine: PostgreSQL 14, 15, or 16+
Default Database Name: manufacturing_db
Default User: postgres
Default Password: veronic@ (or configure in Backend/.env)
Port: 5432

------------------------------------------------------------------------
1. QUICK ONE-CLICK SETUP (WINDOWS)
------------------------------------------------------------------------
1. Make sure PostgreSQL service is running on your computer.
2. Double-click "setup-database.bat".
3. The script will automatically:
   - Create "manufacturing_db" if not existing
   - Create all tables: users, machines, products, production_entries,
     downtime_entries, machine_loss_tracking, system_settings
   - Seed default demo accounts (Owner, Manager, Operators)
   - Seed 5 factory machines (M1, M2, M3, M4, M5)
   - Seed 20 realistic sample downtime entries across the last 60 days
     with various reasons (Material Shortage, Machine Issue, Power Problem, etc.)

------------------------------------------------------------------------
2. MANUAL COMMAND LINE SETUP (PSQL)
------------------------------------------------------------------------
Open Command Prompt or Terminal and run:

psql -U postgres -d postgres -c "CREATE DATABASE manufacturing_db;"
psql -U postgres -d manufacturing_db -f "02-init-full-db.sql"
psql -U postgres -d manufacturing_db -f "03-downtime-analytics-setup.sql"

------------------------------------------------------------------------
3. CONFIGURE DATABASE CREDENTIALS FOR BACKEND
------------------------------------------------------------------------
If your PostgreSQL has a different password or user:
1. Open the file "Backend/.env" in any text editor (Notepad, VS Code).
2. Edit the following fields:
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=manufacturing_db
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
3. Save the file.
4. Restart the backend service.

========================================================================
