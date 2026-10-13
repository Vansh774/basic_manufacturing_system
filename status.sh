#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/lib:$LD_LIBRARY_PATH"

echo "=== System Status ==="

# Database
if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
    echo "✓ Database (PostgreSQL): RUNNING (port 5432)"
else
    echo "✗ Database (PostgreSQL): STOPPED"
fi

# Backend
if curl -s http://localhost:5000/api/test >/dev/null 2>&1; then
    echo "✓ Backend API: RUNNING (http://localhost:5000)"
else
    echo "✗ Backend API: STOPPED"
fi

# Frontend
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✓ Frontend UI: RUNNING (http://localhost:5173)"
else
    echo "✗ Frontend UI: STOPPED"
fi
