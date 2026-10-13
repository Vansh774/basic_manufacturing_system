========================================================================
         MANUFACTURING MANAGEMENT SYSTEM (FULL SUITE)
========================================================================

Welcome to the Manufacturing Management System!

This package includes:
 1. Core Web Application (React.js Frontend + Express.js Backend + Socket.io)
 2. Android Mobile Application (APK/ManufacturingSystem.apk)
 3. Database Configuration & Schemas (Database-Configuration/)
 4. One-click Launchers (Start-Manufacturing-System.bat)

------------------------------------------------------------------------
STEP 1: DATABASE SETUP (FIRST TIME ONLY)
------------------------------------------------------------------------
1. Ensure PostgreSQL is installed and running on your computer.
2. Open the "Database-Configuration" folder.
3. Double-click "setup-database.bat".
   This will automatically create "manufacturing_db", initialize all tables,
   insert default users, machines, and 20 sample downtime entries.
4. If your PostgreSQL password is not "veronic@", open "Backend/.env" and
   update the DB_PASSWORD value.

------------------------------------------------------------------------
STEP 2: RUN THE SYSTEM
------------------------------------------------------------------------
1. Double-click "Start-Manufacturing-System.bat".
2. The server will start and your browser will automatically open:
   http://localhost:5000
3. Log in with any of the demo accounts below:

   OWNER / ADMIN:
   Email:    owner@factory.com
   Password: temp123

   MANAGER:
   Email:    manager@factory.com
   Password: temp123

   OPERATOR:
   Email:    operator1@factory.com
   Password: temp123

------------------------------------------------------------------------
STEP 3: ANDROID APK INSTALLATION
------------------------------------------------------------------------
1. Open the "APK" folder.
2. Transfer "ManufacturingSystem.apk" to your Android mobile or tablet.
3. Tap on the APK to install.
4. Open the app, tap the ⚙ icon, and enter your server IP:
   Example: http://<YOUR_PC_IP>:5000
5. Tap "Connect".

------------------------------------------------------------------------
KEY FEATURES:
------------------------------------------------------------------------
- Real-Time Machine Status (Running, Stopped, Maintenance)
- Real-Time Audio Beep & Alert Toast on Owner and Manager panels
  whenever an operator stops a machine with a downtime reason.
- Downtime Analytics & Production Loss Report:
  - Total Downtime (Minutes & Hours)
  - Production Loss in Units
  - Production Loss in Value (INR)
  - Time filters: Today, 1 Month, 6 Months, 1 Year
- Most Stopped Machines & Reason Breakdown (Owner & Manager dashboards)
- Shift Productivity & Daily Reset System
========================================================================
