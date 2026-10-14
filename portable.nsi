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
    ; 1. Ensure target directory in user's Local AppData exists
    SetOutPath "$LOCALAPPDATA\ManufacturingSystem"

    ; 2. Extract desktop application files, including ffmpeg.dll and all runtime DLLs
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/ManufacturingSystem-Desktop\*.*"

    ; 3. Extract APK and Database-Configuration
    SetOutPath "$LOCALAPPDATA\ManufacturingSystem\APK"
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/APK\*.*"

    SetOutPath "$LOCALAPPDATA\ManufacturingSystem\Database-Configuration"
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/Database-Configuration\*.*"

    ; 4. Always ensure working directory is $LOCALAPPDATA\ManufacturingSystem
    SetOutPath "$LOCALAPPDATA\ManufacturingSystem"

    ; 5. Create Desktop Shortcut for easy 1-click access
    CreateShortCut "$DESKTOP\Manufacturing Management System.lnk" "$LOCALAPPDATA\ManufacturingSystem\ManufacturingApp.exe" "" "$LOCALAPPDATA\ManufacturingSystem\ManufacturingApp.exe" 0

    ; 6. Launch the application immediately
    Exec '"$LOCALAPPDATA\ManufacturingSystem\ManufacturingApp.exe"'
SectionEnd
