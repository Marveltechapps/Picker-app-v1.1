# Android APK Crash Log Capture Script (PowerShell)
# Usage: .\capture-crash-logs.ps1

Write-Host "🔍 Android APK Crash Log Capture" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if device is connected
$devices = adb devices 2>&1
if (-not ($devices -match "device$")) {
    Write-Host "❌ No Android device connected!" -ForegroundColor Red
    Write-Host "Please connect your device via USB and enable USB debugging." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Device connected" -ForegroundColor Green
Write-Host ""

# Android package from app.json (expo.android.package)
$PACKAGE_NAME = "com.anonymous.expoapp"

Write-Host "📦 Package: $PACKAGE_NAME" -ForegroundColor Cyan
Write-Host ""

# Create logs directory
$LOG_DIR = "crash-logs"
if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR | Out-Null
}
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$LOG_FILE = Join-Path $LOG_DIR "crash_$TIMESTAMP.log"

Write-Host "📝 Log file: $LOG_FILE" -ForegroundColor Cyan
Write-Host ""

# Clear previous logs
Write-Host "🧹 Clearing previous logs..." -ForegroundColor Yellow
adb logcat -c | Out-Null

Write-Host ""
Write-Host "🎯 Starting log capture..." -ForegroundColor Green
Write-Host "   - Reproduce the crash on your device" -ForegroundColor Yellow
Write-Host "   - Press Ctrl+C to stop capturing" -ForegroundColor Yellow
Write-Host ""

# Capture FULL logcat to file (no filter), so we don't lose context. Run in background.
Write-Host "📊 Capturing full logcat to $LOG_FILE (Ctrl+C to stop)..." -ForegroundColor Cyan
Write-Host ""

try {
    adb logcat -v time 2>&1 | Tee-Object -FilePath $LOG_FILE
} catch {
    Write-Host ""
    Write-Host "✅ Log capture stopped." -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Logs saved to: $LOG_FILE" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Analyzing crash..." -ForegroundColor Cyan

# Extract key error patterns (file may be large)
$logContent = $null
if (Test-Path $LOG_FILE) {
    $logContent = Get-Content $LOG_FILE -Raw -ErrorAction SilentlyContinue
}
if (-not $logContent) {
    Write-Host "No log content to analyze. Reproduce the crash and run this script again." -ForegroundColor Yellow
    exit 0
}

if ($logContent -match "FATAL EXCEPTION") {
    Write-Host ""
    Write-Host "🚨 FATAL EXCEPTION FOUND:" -ForegroundColor Red
    $logContent | Select-String -Pattern "FATAL EXCEPTION" -Context 0,20 | Select-Object -First 30
}

if ($logContent -match "ClassNotFoundException") {
    Write-Host ""
    Write-Host "🚨 ClassNotFoundException (ProGuard/R8 issue):" -ForegroundColor Red
    $logContent | Select-String -Pattern "ClassNotFoundException"
}

if ($logContent -match "com.mrousavy.camera") {
    Write-Host ""
    Write-Host "🚨 Vision Camera Error:" -ForegroundColor Red
    $logContent | Select-String -Pattern "camera|vision" -CaseSensitive:$false | Select-Object -First 10
}

if ($logContent -match "com.google.mlkit|com.infinitered") {
    Write-Host ""
    Write-Host "🚨 ML Kit Face Detection Error:" -ForegroundColor Red
    $logContent | Select-String -Pattern "mlkit|face" -CaseSensitive:$false | Select-Object -First 10
}

Write-Host ""
Write-Host "✅ Analysis complete. Check $LOG_FILE for full details." -ForegroundColor Green
