#!/bin/bash
echo "======================================================================"
echo "         MANUFACTURING SYSTEM - FIREBASE FIRESTORE SYNC"
echo "======================================================================"
echo "Project: manufacturing-3cfa6 (Cloud Firestore)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../Backend" 2>/dev/null || cd "$SCRIPT_DIR/../manufacturing-system/backend"

node scripts/syncToFirebase.js
