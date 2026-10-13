#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/lib:$LD_LIBRARY_PATH"

PGDATA="$HOME/.local/share/postgresql/data"

echo "Stopping Frontend (Vite)..."
pkill -f "vite" 2>/dev/null || true

echo "Stopping Backend (server.js)..."
pkill -f "node server.js" 2>/dev/null || true

if [ "$1" == "--all" ]; then
    echo "Stopping PostgreSQL..."
    pg_ctl -D "$PGDATA" stop 2>/dev/null || true
fi

echo "Stopped successfully."
