@echo off
REM Batch file to run Expo app with Android emulator fallback
REM Usage: run-app.bat [android|web|ios]

setlocal enabledelayedexpansion

set PLATFORM=%1
if "%PLATFORM%"=="" set PLATFORM=android

echo.
echo ========================================
echo   Expo App Launcher
echo ========================================
echo.

REM Check if PowerShell script exists and use it
if exist "run-app.ps1" (
    echo Running PowerShell script...
    powershell.exe -ExecutionPolicy Bypass -File "run-app.ps1" -Platform %PLATFORM%
    goto :end
)

REM Fallback: Direct execution
echo Checking Android emulator...

REM Check if adb is available
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Warning: ADB not found in PATH
    echo Attempting to find Android SDK...
)

REM Check if emulator is running
adb devices | findstr /C:"emulator" /C:"device" >nul
if %ERRORLEVEL% EQU 0 (
    echo Android emulator detected
    echo Starting Expo on Android...
    call npx expo start --android
) else (
    echo Android emulator not detected
    echo Falling back to web...
    call npx expo start --web
)

:end
pause
