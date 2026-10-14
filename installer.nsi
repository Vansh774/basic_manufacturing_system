; -------------------------------------------------------------
; NSIS Script for Manufacturing Management System
; Installs all files & folders visibly, creates shortcuts, and launches app
; -------------------------------------------------------------

!include "MUI2.nsh"
!include "FileFunc.nsh"

; General Settings
Name "Manufacturing Management System"
OutFile "/home/vijay-odedra/basic_manufacturing_system/Release/ManufacturingSystem_Setup.exe"
InstallDir "$PROFILE\ManufacturingSystem"
InstallDirRegKey HKCU "Software\ManufacturingSystem" "Install_Dir"
RequestExecutionLevel user

; Compression
SetCompressor /SOLID lzma

; Interface Configuration
!define MUI_ABORTWARNING
!define MUI_ICON "/home/vijay-odedra/basic_manufacturing_system/manufacturing-system/manufacturing_app/windows/runner/resources/app_icon.ico"
!define MUI_UNICON "/home/vijay-odedra/basic_manufacturing_system/manufacturing-system/manufacturing_app/windows/runner/resources/app_icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Finish Page options: Launches app AND opens the installation folder!
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch Manufacturing Management System (Desktop App)"
!define MUI_FINISHPAGE_RUN_FUNCTION LaunchApp
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Open Installed Folder (View all files, APK & Database)"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OpenInstalledFolder
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Launch App function (Guarantees working directory is $INSTDIR)
Function LaunchApp
    SetOutPath "$INSTDIR"
    ExecShell "" "$INSTDIR\ManufacturingSystem.exe"
FunctionEnd

; Open Installed Folder function
Function OpenInstalledFolder
    ExecShell "open" "$INSTDIR"
FunctionEnd

; -------------------------------------------------------------
; Installer Section
; -------------------------------------------------------------
Section "Manufacturing System Core" SecCore
    SetOutPath "$INSTDIR"

    ; Copy Desktop Application files (ManufacturingSystem.exe, ffmpeg.dll, resources, etc.)
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/ManufacturingSystem-Desktop\*.*"

    ; Copy APK folder
    SetOutPath "$INSTDIR\APK"
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/APK\*.*"

    ; Copy Database Configuration folder
    SetOutPath "$INSTDIR\Database-Configuration"
    File /r "/home/vijay-odedra/basic_manufacturing_system/Release/Database-Configuration\*.*"

    ; Copy README
    SetOutPath "$INSTDIR"
    File "/home/vijay-odedra/basic_manufacturing_system/Release/README.txt"

    ; Store installation folder in registry
    WriteRegStr HKCU "Software\ManufacturingSystem" "Install_Dir" "$INSTDIR"

    ; Create uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; Write Windows Uninstall Registry entries
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "DisplayName" "Manufacturing Management System"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "UninstallString" '"$INSTDIR\uninstall.exe"'
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "DisplayIcon" "$INSTDIR\ManufacturingSystem.exe,0"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "DisplayVersion" "1.0.0"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "Publisher" "Manufacturing Management Solutions"

    ; Set working directory to $INSTDIR so ffmpeg.dll is always found!
    SetOutPath "$INSTDIR"

    ; Create Desktop Shortcuts
    CreateShortCut "$DESKTOP\Manufacturing Management System.lnk" "$INSTDIR\ManufacturingSystem.exe" "" "$INSTDIR\ManufacturingSystem.exe" 0
    CreateShortCut "$DESKTOP\Manufacturing System Folder.lnk" "$INSTDIR" "" "$INSTDIR\app.ico" 0

    ; Create Start Menu Shortcuts
    CreateDirectory "$SMPROGRAMS\Manufacturing Management System"
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Manufacturing Management System.lnk" "$INSTDIR\ManufacturingSystem.exe" "" "$INSTDIR\ManufacturingSystem.exe" 0
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Open Manufacturing System Folder.lnk" "$INSTDIR"
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Android APK Folder.lnk" "$INSTDIR\APK"
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Database Configuration.lnk" "$INSTDIR\Database-Configuration"
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Uninstall.lnk" "$INSTDIR\uninstall.exe"

SectionEnd

; -------------------------------------------------------------
; Uninstaller Section
; -------------------------------------------------------------
Section "Uninstall"
    ; Remove shortcuts
    Delete "$DESKTOP\Manufacturing Management System.lnk"
    Delete "$DESKTOP\Manufacturing System Folder.lnk"
    RMDir /r "$SMPROGRAMS\Manufacturing Management System"

    ; Remove files and directories
    RMDir /r "$INSTDIR\APK"
    RMDir /r "$INSTDIR\Database-Configuration"
    RMDir /r "$INSTDIR\resources"
    RMDir /r "$INSTDIR\locales"
    Delete "$INSTDIR\*.*"

    ; Remove install directory
    RMDir "$INSTDIR"

    ; Remove registry keys
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem"
    DeleteRegKey HKCU "Software\ManufacturingSystem"
SectionEnd
