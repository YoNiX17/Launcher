; PiErOW Launcher - Debug Installer Script
; Detailed logging for troubleshooting

!include "LogicLib.nsh"

; Enable logging
!define ENABLE_LOGGING

; Log file path
Var LogFile

!macro customInit
    ; Create log file on user's desktop
    StrCpy $LogFile "$DESKTOP\PiErOW-Installer-Log.txt"
    
    ; Open log file and write header
    FileOpen $0 $LogFile w
    FileWrite $0 "=======================================$\r$\n"
    FileWrite $0 "PiErOW Launcher Installer Log$\r$\n"
    FileWrite $0 "=======================================$\r$\n"
    FileWrite $0 "Date: $\r$\n"
    FileWrite $0 "OS Version: $\r$\n"
    FileWrite $0 "Install Dir: $INSTDIR$\r$\n"
    FileWrite $0 "Temp Dir: $TEMP$\r$\n"
    FileWrite $0 "Windows Dir: $WINDIR$\r$\n"
    FileWrite $0 "Program Files: $PROGRAMFILES$\r$\n"
    FileWrite $0 "User: $USERNAME$\r$\n"
    FileWrite $0 "=======================================$\r$\n"
    FileWrite $0 "$\r$\n"
    FileWrite $0 "[INIT] Installer started$\r$\n"
    FileClose $0
!macroend

!macro customHeader
    ; Log: Header displayed
    FileOpen $0 $LogFile a
    FileWrite $0 "[HEADER] Welcome page displayed$\r$\n"
    FileClose $0
!macroend

!macro customInstallMode
    ; Log: Install mode selected
    FileOpen $0 $LogFile a
    FileWrite $0 "[MODE] Install mode: $MultiUser.InstallMode$\r$\n"
    FileClose $0
!macroend

!macro customPageAfterChangeDir
    ; Log: Directory changed
    FileOpen $0 $LogFile a
    FileWrite $0 "[DIR] Installation directory set to: $INSTDIR$\r$\n"
    FileClose $0
!macroend

!macro customInstall
    ; Log: Installation started
    FileOpen $0 $LogFile a
    FileWrite $0 "[INSTALL] Starting file installation...$\r$\n"
    FileWrite $0 "[INSTALL] Target: $INSTDIR$\r$\n"
    FileClose $0
    
    ; Log: Files installed
    FileOpen $0 $LogFile a
    FileWrite $0 "[INSTALL] Files extracted successfully$\r$\n"
    FileClose $0
    
    ; Log: Shortcuts
    FileOpen $0 $LogFile a
    FileWrite $0 "[SHORTCUT] Creating desktop shortcut...$\r$\n"
    FileWrite $0 "[SHORTCUT] Creating start menu shortcut...$\r$\n"
    FileClose $0
!macroend

!macro customInstallSuccess
    FileOpen $0 $LogFile a
    FileWrite $0 "[SUCCESS] Installation completed successfully!$\r$\n"
    FileWrite $0 "=======================================$\r$\n"
    FileClose $0
!macroend

!macro customUnInit
    ; Log uninstall
    StrCpy $LogFile "$DESKTOP\PiErOW-Uninstall-Log.txt"
    FileOpen $0 $LogFile w
    FileWrite $0 "PiErOW Launcher Uninstall Log$\r$\n"
    FileWrite $0 "[UNINIT] Uninstaller started$\r$\n"
    FileClose $0
!macroend

!macro customUnInstall  
    FileOpen $0 $LogFile a
    FileWrite $0 "[UNINSTALL] Removing files...$\r$\n"
    FileClose $0
!macroend

!macro customUnInstallSuccess
    FileOpen $0 $LogFile a
    FileWrite $0 "[SUCCESS] Uninstallation completed$\r$\n"
    FileClose $0
!macroend
