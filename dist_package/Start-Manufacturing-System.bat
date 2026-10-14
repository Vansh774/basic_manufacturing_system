@echo off
title Manufacturing Management System
color 0A

echo ======================================================================
echo          MANUFACTURING MANAGEMENT SYSTEM - LAUNCHER
echo ======================================================================
echo.

cd /d "%~dp0Backend"

:: Locate Node.js executable (bundled or installed)
if exist "%~dp0Backend\bin\node.exe" (
    set "NODE_EXE=%~dp0Backend\bin\node.exe"
    goto FOUND_NODE
)
if exist "%~dp0bin\node.exe" (
    set "NODE_EXE=%~dp0bin\node.exe"
    goto FOUND_NODE
)

set NODE_EXE=node
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 goto FOUND_NODE

if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    goto FOUND_NODE
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
    goto FOUND_NODE
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    goto FOUND_NODE
)

if exist "%APPDATA%\npm\node.exe" (
    set "NODE_EXE=%APPDATA%\npm\node.exe"
    goto FOUND_NODE
)

:: If not found
color 0C
echo [ERROR] Node.js is not found on this computer!
echo.
echo Please install Node.js from https://nodejs.org (LTS recommended).
echo After installing, run this shortcut again.
echo.
start https://nodejs.org
pause
exit /b 1

:FOUND_NODE
echo [1/3] Node.js detected: %NODE_EXE%
echo [2/3] Starting Manufacturing System Server on http://localhost:5000 ...

:: Launch background node server
start "Manufacturing Backend Server" /min "%NODE_EXE%" server.js

:: Wait 3 seconds for server initialization
timeout /t 3 /nobreak >nul

echo [3/3] Opening Manufacturing System in default browser...
start http://localhost:5000

echo.
echo ======================================================================
echo  MANUFACTURING SYSTEM IS RUNNING SUCCESSFULLY!
echo ======================================================================
echo.
echo  - Web Application:   http://localhost:5000
echo  - Mobile APK:        Located in "APK\ManufacturingSystem.apk"
echo  - Database Config:   Located in "Database-Configuration"
echo.
echo  DEMO CREDENTIALS:
echo    - Owner / Admin:   owner@factory.com    / temp123
echo    - Manager:         manager@factory.com  / temp123
echo    - Operator 1:      operator1@factory.com / temp123
echo.
echo  To STOP the server, run Stop-Manufacturing-System.bat or close this window.
echo ======================================================================
echo.
pause
