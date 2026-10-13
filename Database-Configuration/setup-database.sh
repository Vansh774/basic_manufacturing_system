#!/bin/bash
echo "======================================================================"
echo "          MANUFACTURING SYSTEM - AUTOMATIC DATABASE SETUP"
echo "======================================================================"

export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-veronic@}"
export PGDATABASE="${PGDATABASE:-manufacturing_db}"

echo "Connecting to PostgreSQL at $PGHOST:$PGPORT as $PGUSER..."

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "02-init-full-db.sql" || {
    echo "Creating database $PGDATABASE..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE manufacturing_db;"
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "02-init-full-db.sql"
}

echo "Applying Downtime Analytics & Sample Data..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "03-downtime-analytics-setup.sql"

echo "======================================================================"
echo " DATABASE SETUP COMPLETED SUCCESSFULLY!"
echo "======================================================================"
