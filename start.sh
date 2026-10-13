#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/lib:$LD_LIBRARY_PATH"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/manufacturing-system/backend"
FRONTEND_DIR="$PROJECT_ROOT/manufacturing-system/frontend"
PGDATA="$HOME/.local/share/postgresql/data"
PGLOG="$HOME/.local/share/postgresql/logfile"

# 1. Start PostgreSQL if not running
if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
    echo "Starting PostgreSQL..."
    pg_ctl -D "$PGDATA" -l "$PGLOG" start
    sleep 2
else
    echo "PostgreSQL is already running."
fi

# 2. Start Backend if not running on port 5000
if ! curl -s http://localhost:5000/api/test >/dev/null 2>&1; then
    echo "Starting Backend server (port 5000)..."
    cd "$BACKEND_DIR" && nohup node server.js > backend.log 2>&1 &
    sleep 2
else
    echo "Backend server is already running on port 5000."
fi

# 3. Start Frontend if not running on port 5173
if ! curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "Starting Frontend server (port 5173)..."
    cd "$FRONTEND_DIR" && nohup npm run dev -- --host > frontend.log 2>&1 &
    sleep 2
else
    echo "Frontend server is already running on port 5173."
fi

echo ""
echo "============================================="
echo " Manufacturing System is Running!"
echo "============================================="
echo " Frontend:  http://localhost:5173"
echo " Backend:   http://localhost:5000"
echo " Database:  PostgreSQL (port 5432)"
echo ""
echo " Demo Logins:"
echo "   Owner:    owner@factory.com    / temp123"
echo "   Manager:  manager@factory.com  / temp123"
echo "   Operator: operator1@factory.com / temp123"
echo "============================================="
