#!/bin/bash
# Android APK Crash Log Capture Script
# Usage: ./capture-crash-logs.sh

echo "🔍 Android APK Crash Log Capture"
echo "=================================="
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device connected!"
    echo "Please connect your device via USB and enable USB debugging."
    exit 1
fi

echo "✅ Device connected"
echo ""

# Get package name from app.json
PACKAGE_NAME="app.rork.mobile_ui_clone_project"

echo "📦 Package: $PACKAGE_NAME"
echo ""

# Create logs directory
LOG_DIR="crash-logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/crash_$TIMESTAMP.log"

echo "📝 Log file: $LOG_FILE"
echo ""

# Clear previous logs
echo "🧹 Clearing previous logs..."
adb logcat -c

echo ""
echo "🎯 Starting log capture..."
echo "   - Reproduce the crash on your device"
echo "   - Press Ctrl+C to stop capturing"
echo ""

# Capture logs with filters
adb logcat -v time \
  *:E \
  ReactNative:V \
  ReactNativeJS:V \
  AndroidRuntime:E \
  System.err:E \
  | tee "$LOG_FILE" | grep -E "FATAL|AndroidRuntime|ReactNative|$PACKAGE_NAME|com.mrousavy.camera|com.google.mlkit|com.worklets|Error|Exception"

echo ""
echo "✅ Logs saved to: $LOG_FILE"
echo ""
echo "🔍 Analyzing crash..."

# Extract key error patterns
if grep -q "FATAL EXCEPTION" "$LOG_FILE"; then
    echo ""
    echo "🚨 FATAL EXCEPTION FOUND:"
    grep -A 20 "FATAL EXCEPTION" "$LOG_FILE" | head -30
fi

if grep -q "ClassNotFoundException" "$LOG_FILE"; then
    echo ""
    echo "🚨 ClassNotFoundException (ProGuard/R8 issue):"
    grep "ClassNotFoundException" "$LOG_FILE"
fi

if grep -q "com.mrousavy.camera" "$LOG_FILE"; then
    echo ""
    echo "🚨 Vision Camera Error:"
    grep -i "camera\|vision" "$LOG_FILE" | head -10
fi

if grep -q "com.google.mlkit\|com.infinitered" "$LOG_FILE"; then
    echo ""
    echo "🚨 ML Kit Face Detection Error:"
    grep -i "mlkit\|face" "$LOG_FILE" | head -10
fi

echo ""
echo "✅ Analysis complete. Check $LOG_FILE for full details."
