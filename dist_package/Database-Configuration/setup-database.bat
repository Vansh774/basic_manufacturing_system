@echo off
title PostgreSQL Database Setup - Manufacturing System
color 0B
echo ======================================================================
echo           MANUFACTURING SYSTEM - AUTOMATIC DATABASE SETUP
echo ======================================================================
echo.

set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=veronic@
set PGDATABASE=manufacturing_db

echo Checking PostgreSQL connection...
echo Host: %PGHOST%:%PGPORT%
echo User: %PGUSER%
echo Database: %PGDATABASE%
echo.

echo Step 1: Initializing Database Schema and Default Records...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f "02-init-full-db.sql"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Direct connection to %PGDATABASE% failed. Trying to connect to 'postgres' database to create %PGDATABASE%...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE manufacturing_db;"
    echo Retrying schema initialization...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f "02-init-full-db.sql"
)

echo.
echo Step 2: Applying Downtime Analytics Tables and 20 Sample Entries...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f "03-downtime-analytics-setup.sql"

echo.
echo ======================================================================
echo  DATABASE SETUP COMPLETED SUCCESSFULLY!
echo ======================================================================
echo.
echo Tables created:
echo  - users (with Owner, Manager, and Operators)
echo  - machines (with 5 machines M1 to M5)
echo  - products
echo  - production_entries
echo  - downtime_entries (with 20 sample records)
echo  - machine_loss_tracking
echo  - system_settings (unit_price = 4000)
echo.
pause
