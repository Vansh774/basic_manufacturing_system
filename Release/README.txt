================================================================================
 MANUFACTURING MANAGEMENT SYSTEM - PRODUCTION RELEASE PACKAGE
================================================================================
Release Version : 1.0.0
Build Date      : October 2026
Platform        : Windows Desktop (Native Window), Android APK, Cloud & Local DB

================================================================================
 1. RELEASE CONTENTS & EXACT FILE PATHS
================================================================================

1) Native Desktop Application Installer (EXE):
   File: Release\ManufacturingSystem_Setup.exe
   Description: Complete Windows installer. Installs the native desktop app,
   creates Desktop and Start Menu shortcuts, and automatically extracts the
   Android APK and Database-Configuration folders.

2) Portable Standalone Desktop Application (No Installation Required):
   Folder: Release\ManufacturingSystem-Desktop\
   Executable: Release\ManufacturingSystem-Desktop\ManufacturingSystem.exe
   Batch: Release\ManufacturingSystem-Desktop\Quick-Start.bat
   Description: Dedicated native application window (NOT an external browser).
   Runs self-contained with embedded backend, built frontend, and Cloud Firestore.

3) Android Mobile Application (APK):
   Folder: Release\APK\
   File: Release\APK\ManufacturingSystem.apk
   Guide: Release\APK\README-APK.txt
   Description: Fully responsive Android application with hardware acceleration,
   live alert sound, and instant server connectivity.

4) Database & Cloud Configuration:
   Folder: Release\Database-Configuration\
   Files:
     - 01-create-database.sql (PostgreSQL database creation)
     - 02-init-full-db.sql (Core schema, 22 machines, 5 users, 450 production records)
     - 03-downtime-analytics-setup.sql (Downtime analytics, loss tracking, 20 sample records)
     - database.env (Environment configuration file)
     - firebase-service-account.json (Active Firebase service account credentials)
     - setup-database.bat / setup-database.sh (Automated 1-click database setup)
     - sync-to-firebase.bat / sync-to-firebase.sh (1-click PostgreSQL to Firestore syncer)
     - README-Database.txt & README-Firebase.txt

================================================================================
 2. HOW TO RUN THE DESKTOP APPLICATION
================================================================================

METHOD A - Standard Installer:
  1. Double-click "ManufacturingSystem_Setup.exe".
  2. Follow the setup wizard and click "Install".
  3. On completion, click "Finish" to launch the native desktop window.
  4. A shortcut "Manufacturing Management System" will be created on your Desktop.

METHOD B - Portable Standalone (No Install):
  1. Open the folder "Release\ManufacturingSystem-Desktop\".
  2. Double-click "ManufacturingSystem.exe" (or "Quick-Start.bat").
  3. The native window opens immediately showing the live factory dashboard.

================================================================================
 3. DEFAULT LOGIN CREDENTIALS
================================================================================

Role       | Email               | Password
-----------|---------------------|---------
Admin/Owner| owner@factory.com   | temp123
Manager    | manager@factory.com | temp123
Operator 1 | operator1@factory.com | temp123
Operator 2 | operator2@factory.com | temp123
Operator 3 | operator3@factory.com | temp123

================================================================================
 4. KEY FEATURES INCLUDED
================================================================================
✓ Native Desktop Window Application (Dedicated UI, no browser URL bar or tabs)
✓ Real-Time Downtime Analytics (Filterable by Today, 1 Month, 6 Months, 1 Year)
✓ Production Loss Tracking in Units & Rupees (₹4000/unit default)
✓ Most Stopped Machine Analysis with downtime reasons & stoppage durations
✓ Real-Time Audio Siren & Toast Alerts on Manager & Admin dashboards via Socket.io
✓ 542 Documents Synced across 8 Cloud Firestore Collections (Firebase)
✓ PostgreSQL 16 Support with resilient error handling and automatic reconnection
✓ Responsive Android Mobile APK (Hardware accelerated with audio support)
================================================================================
