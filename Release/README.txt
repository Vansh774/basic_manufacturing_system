================================================================================
 MANUFACTURING MANAGEMENT SYSTEM - PRODUCTION RELEASE PACKAGE
================================================================================
Release Version : 1.0.0
Build Date      : October 2026
Platform        : Windows Desktop (Dedicated Window), Android APK, Cloud Firestore

================================================================================
 1. EXACT FILE LOCATIONS & WHICH EXE TO USE
================================================================================

Folder Path:
/home/vijay-odedra/basic_manufacturing_system/Release/

Inside this folder, you have 2 easy options to run:

--------------------------------------------------------------------------------
OPTION 1 (FASTEST - NO INSTALLATION REQUIRED):
--------------------------------------------------------------------------------
File: Release/ManufacturingSystem.exe
Size: 88 MB

HOW IT WORKS:
- This is a TRUE SINGLE-FILE STANDALONE EXECUTABLE.
- You can copy or move "ManufacturingSystem.exe" ANYWHERE (Desktop, Downloads, 
  USB drive, etc.).
- When you double-click it, it automatically extracts all required system DLLs 
  (including ffmpeg.dll, directx, audio libraries) and launches the native 
  application window immediately.
- The error "ffmpeg.dll was not found" CANNOT happen because all libraries are 
  self-contained inside this file.
- It also automatically places a convenient shortcut on your Desktop.

--------------------------------------------------------------------------------
OPTION 2 (FORMAL WINDOWS SETUP INSTALLER):
--------------------------------------------------------------------------------
File: Release/ManufacturingSystem_Setup.exe
Size: 88 MB

HOW IT WORKS:
- Complete Windows Setup Wizard.
- Double-click to install into: %LOCALAPPDATA%\ManufacturingSystem\
- Creates Start Menu shortcuts and a Desktop shortcut.
- Automatically extracts the Android APK and Database Configuration folders.
- On the final screen, check "Launch Manufacturing Management System" and click 
  Finish to open the app.

--------------------------------------------------------------------------------
OPTION 3 (STANDALONE DIRECTORY WITH BATCH LAUNCHER):
--------------------------------------------------------------------------------
Folder: Release/ManufacturingSystem-Desktop/
Batch:  Release/ManufacturingSystem-Desktop/Quick-Start.bat

HOW IT WORKS:
- Run directly from inside the folder by double-clicking "Quick-Start.bat" 
  or "ManufacturingApp.exe".
- All DLLs (ffmpeg.dll, vulkan, chromium libraries) are present in this folder.

================================================================================
 2. ANDROID MOBILE APPLICATION (APK)
================================================================================
File:  Release/APK/ManufacturingSystem.apk (354 KB)
Guide: Release/APK/README-APK.txt

Features:
- Responsive machine monitoring & operator control.
- Real-time audio alerts & Socket.io integration.
- Hardware accelerated WebView.

================================================================================
 3. DATABASE & CLOUD FIRESTORE
================================================================================
Folder: Release/Database-Configuration/
- All 542 records across 8 tables are PRE-EMBEDDED into the application.
- Works 100% OFFLINE without requiring PostgreSQL to be installed!
- When internet is available, syncs in real-time with Google Cloud Firestore 
  (Project: manufacturing-3cfa6).

================================================================================
 4. DEFAULT LOGIN CREDENTIALS
================================================================================
Role         | Email                 | Password
-------------|-----------------------|---------
Admin/Owner  | owner@factory.com     | temp123
Manager      | manager@factory.com   | temp123
Operator 1   | operator1@factory.com | temp123
Operator 2   | operator2@factory.com | temp123
Operator 3   | operator3@factory.com | temp123

Tip: On the login screen, click the quick fill buttons ("👑 Owner", "👔 Manager", 
or "⚙️ Operator") to automatically fill the credentials!
================================================================================
