@echo off
title Stopping Manufacturing Management System
color 0C

echo Stopping Manufacturing System server on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Terminating process PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo Server stopped successfully.
timeout /t 2 /nobreak >nul
