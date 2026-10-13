@echo off
title Manufacturing Management System
color 0A

echo ======================================================================
echo          MANUFACTURING MANAGEMENT SYSTEM - LAUNCHER
echo ======================================================================
echo.

cd /d "%~dp0Backend"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org (LTS version recommended).
    echo After installing Node.js, run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js runtime detected.
echo [2/3] Starting Manufacturing System Server on http://localhost:5000 ...

:: Launch node server
start "Manufacturing Backend Server" /min cmd /c "node server.js"

:: Wait 3 seconds for server initialization
timeout /t 3 /nobreak >nul

echo [3/3] Opening Manufacturing System in your default browser...
start http://localhost:5000

echo.
echo ======================================================================
echo  SYSTEM IS RUNNING SUCCESSFULLY!
echo ======================================================================
echo.
echo  Web Application:  http://localhost:5000
echo  Android APK:      Found in "APK\ManufacturingSystem.apk"
echo  Database Config:  Found in "Database-Configuration"
echo.
echo  Demo Credentials:
echo    - Admin / Owner:  owner@factory.com    / temp123
echo    - Manager:        manager@factory.com  / temp123
echo    - Operator 1:     operator1@factory.com / temp123
echo.
echo  To STOP the server, run Stop-Manufacturing-System.bat or close this window.
echo ======================================================================
echo.
pause
