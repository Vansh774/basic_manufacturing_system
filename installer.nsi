; -------------------------------------------------------------
; NSIS Script for Manufacturing Management System
; -------------------------------------------------------------

!include "MUI2.nsh"
!include "FileFunc.nsh"

; General Settings
Name "Manufacturing Management System"
OutFile "/home/vijay-odedra/basic_manufacturing_system/ManufacturingSystem_Setup.exe"
InstallDir "$LOCALAPPDATA\ManufacturingSystem"
InstallDirRegKey HKCU "Software\ManufacturingSystem" "Install_Dir"
RequestExecutionLevel user

; Compression
SetCompressor /SOLID lzma

; Interface Configuration
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Finish Page options
!define MUI_FINISHPAGE_RUN "$INSTDIR\Start-Manufacturing-System.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Manufacturing System Now"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Open Android APK & Database Folders"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OpenExtras
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Extras opener function
Function OpenExtras
    ExecShell "open" "$INSTDIR\APK"
    ExecShell "open" "$INSTDIR\Database-Configuration"
FunctionEnd

; -------------------------------------------------------------
; Installer Section
; -------------------------------------------------------------
Section "Manufacturing System Core" SecCore
    SetOutPath "$INSTDIR"

    ; Copy all files recursively from dist_package
    File /r "/home/vijay-odedra/basic_manufacturing_system/dist_package\*.*"

    ; Store installation folder in registry
    WriteRegStr HKCU "Software\ManufacturingSystem" "Install_Dir" "$INSTDIR"

    ; Create uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; Write Windows Uninstall Registry entries
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "DisplayName" "Manufacturing Management System"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "UninstallString" '"$INSTDIR\uninstall.exe"'
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "DisplayIcon" "$INSTDIR\Start-Manufacturing-System.bat"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "DisplayVersion" "1.0.0"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem" "Publisher" "Manufacturing Management Solutions"

    ; Create Desktop Shortcut
    CreateShortCut "$DESKTOP\Manufacturing Management System.lnk" "$INSTDIR\Start-Manufacturing-System.bat" "" "$INSTDIR\Start-Manufacturing-System.bat" 0

    ; Create Start Menu Shortcuts
    CreateDirectory "$SMPROGRAMS\Manufacturing Management System"
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Launch Manufacturing System.lnk" "$INSTDIR\Start-Manufacturing-System.bat"
    CreateShortCut "$SMPROGRAMS\Manufacturing Management System\Stop Manufacturing System.lnk" "$INSTDIR\Stop-Manufacturing-System.bat"
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
    RMDir /r "$SMPROGRAMS\Manufacturing Management System"

    ; Remove files and directories
    RMDir /r "$INSTDIR\APK"
    RMDir /r "$INSTDIR\Database-Configuration"
    RMDir /r "$INSTDIR\Backend"
    RMDir /r "$INSTDIR\Frontend"
    Delete "$INSTDIR\Start-Manufacturing-System.bat"
    Delete "$INSTDIR\Stop-Manufacturing-System.bat"
    Delete "$INSTDIR\README-QuickStart.txt"
    Delete "$INSTDIR\uninstall.exe"

    ; Remove install directory if empty
    RMDir "$INSTDIR"

    ; Remove registry keys
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ManufacturingSystem"
    DeleteRegKey HKCU "Software\ManufacturingSystem"
SectionEnd
