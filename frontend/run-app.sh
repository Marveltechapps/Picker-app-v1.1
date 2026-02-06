#!/bin/bash
# Bash script to run Expo app with Android emulator fallback
# Usage: ./run-app.sh [android|web|ios]

PLATFORM=${1:-android}

echo "🚀 Starting Expo App..."

# Function to check if Android emulator is running
check_android_emulator() {
    if command -v adb &> /dev/null; then
        if adb devices | grep -q "emulator.*device"; then
            echo "✅ Android emulator detected"
            return 0
        fi
    fi
    return 1
}

# Function to start Android emulator
start_android_emulator() {
    echo "📱 Attempting to start Android emulator..."
    
    # Find emulator path
    if [ -z "$ANDROID_HOME" ]; then
        EMULATOR_PATH="$HOME/Library/Android/sdk/emulator"
        if [ ! -d "$EMULATOR_PATH" ]; then
            EMULATOR_PATH="$HOME/Android/Sdk/emulator"
        fi
    else
        EMULATOR_PATH="$ANDROID_HOME/emulator"
    fi
    
    if [ -f "$EMULATOR_PATH/emulator" ]; then
        # List available AVDs
        AVD_LIST=$("$EMULATOR_PATH/emulator" -list-avds 2>&1)
        if [ -n "$AVD_LIST" ]; then
            FIRST_AVD=$(echo "$AVD_LIST" | head -n 1)
            echo "Starting emulator: $FIRST_AVD"
            "$EMULATOR_PATH/emulator" -avd "$FIRST_AVD" > /dev/null 2>&1 &
            echo "⏳ Waiting for emulator to boot (30 seconds)..."
            sleep 30
            
            # Wait for device to be ready
            MAX_ATTEMPTS=12
            ATTEMPT=0
            while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
                if check_android_emulator; then
                    echo "✅ Emulator is ready!"
                    return 0
                fi
                echo "Waiting for emulator... ($ATTEMPT/$MAX_ATTEMPTS)"
                sleep 5
                ATTEMPT=$((ATTEMPT + 1))
            done
            echo "⚠️  Emulator started but may not be fully ready"
            return 1
        else
            echo "❌ No Android Virtual Devices (AVD) found"
            echo "   Please create an AVD in Android Studio"
            return 1
        fi
    else
        echo "❌ Android emulator not found"
        echo "   Please install Android Studio and set up an emulator"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Start the app based on platform
case "$PLATFORM" in
    android)
        if check_android_emulator; then
            echo "✅ Running on Android emulator..."
            npx expo start --android
        else
            echo "⚠️  Android emulator not detected. Attempting to start..."
            if start_android_emulator; then
                echo "✅ Running on Android emulator..."
                npx expo start --android
            else
                echo "❌ Failed to start Android emulator. Falling back to web..."
                echo "🌐 Starting on web instead..."
                npx expo start --web
            fi
        fi
        ;;
    web)
        echo "🌐 Running on web browser..."
        npx expo start --web
        ;;
    ios)
        echo "🍎 Running on iOS simulator..."
        npx expo start --ios
        ;;
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "   Valid options: android, web, ios"
        echo "   Falling back to web..."
        npx expo start --web
        ;;
esac
