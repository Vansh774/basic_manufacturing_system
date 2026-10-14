; -------------------------------------------------------------
; NSIS Portable Launcher for Manufacturing Management System
; Creates a true standalone single-file EXE: ManufacturingSystem.exe
; -------------------------------------------------------------

!include "FileFunc.nsh"

Name "Manufacturing Management System"
OutFile "/home/vijay-odedra/basic_manufacturing_system/Release/ManufacturingSystem.exe"
RequestExecutionLevel user
SilentInstall silent

Icon "/home/vijay-odedra/basic_manufacturing_system/manufacturing-system/manufacturing_app/windows/runner/resources/app_icon.ico"

SetCompressor /SOLID lzma

Section "Main"
    ; 1. Visible folder in user home directory (C:\Users\<Username>\ManufacturingSystem)
    SetOutPath "$PROFILE\ManufacturingSystem"

    ; 2. Extract desktop application files, including ffmpeg.dll and all runtime DLLs
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/ManufacturingSystem-Desktop\*.*"

    ; 3. Extract APK and Database-Configuration
    SetOutPath "$PROFILE\ManufacturingSystem\APK"
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/APK\*.*"

    SetOutPath "$PROFILE\ManufacturingSystem\Database-Configuration"
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/Database-Configuration\*.*"

    ; 4. Copy README
    SetOutPath "$PROFILE\ManufacturingSystem"
    File "/home/vijay-odedra/basic_manufacturing_system/Release/README.txt"

    ; 5. Set working directory to $PROFILE\ManufacturingSystem so ffmpeg.dll is ALWAYS found
    SetOutPath "$PROFILE\ManufacturingSystem"

    ; 6. Create Desktop Shortcuts
    CreateShortCut "$DESKTOP\Manufacturing Management System.lnk" "$PROFILE\ManufacturingSystem\ManufacturingSystem.exe" "" "$PROFILE\ManufacturingSystem\ManufacturingSystem.exe" 0
    CreateShortCut "$DESKTOP\Manufacturing System Folder.lnk" "$PROFILE\ManufacturingSystem" "" "$PROFILE\ManufacturingSystem\app.ico" 0

    ; 7. Open the folder in Windows Explorer so user can see all files
    ExecShell "open" "$PROFILE\ManufacturingSystem"

    ; 8. Launch the application immediately
    SetOutPath "$PROFILE\ManufacturingSystem"
    ExecShell "" "$PROFILE\ManufacturingSystem\ManufacturingSystem.exe"
SectionEnd
