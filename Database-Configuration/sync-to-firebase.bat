@echo off
title Sync PostgreSQL to Firebase Cloud Firestore
color 0E

echo ======================================================================
echo          MANUFACTURING SYSTEM - FIREBASE FIRESTORE SYNC
echo ======================================================================
echo.
echo Connecting to Firebase project: manufacturing-3cfa6
echo Database: Cloud Firestore
echo.

cd /d "%~dp0..\Backend"

node scripts/syncToFirebase.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Firebase sync encountered an issue.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo  FIREBASE CLOUD SYNC COMPLETED SUCCESSFULLY!
echo ======================================================================
echo.
pause
