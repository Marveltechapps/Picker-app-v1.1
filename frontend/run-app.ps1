# PowerShell script to run Expo app with Android emulator fallback
# Usage: .\run-app.ps1 [android|web|ios] [-ClearCache]
# Use -ClearCache when you see Metro "Got unexpected undefined" error

param(
    [string]$Platform = "android",
    [switch]$ClearCache
)

Write-Host "[*] Starting Expo App..." -ForegroundColor Cyan

# Function to check if Android emulator is running
function Test-AndroidEmulator {
    try {
        $devices = adb devices 2>&1
        if ($devices -match "emulator.*device") {
            Write-Host "[OK] Android emulator detected" -ForegroundColor Green
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# Function to start Android emulator
function Start-AndroidEmulator {
    Write-Host "[*] Attempting to start Android emulator..." -ForegroundColor Yellow
    
    # Try to find and start emulator
    $emulatorPath = $env:ANDROID_HOME
    if (-not $emulatorPath) {
        $emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator"
    }
    
    if (Test-Path "$emulatorPath\emulator.exe") {
        # List available AVDs
        $avds = & "$emulatorPath\emulator.exe" -list-avds 2>&1
        if ($avds.Count -gt 0) {
            $firstAvd = $avds[0]
            Write-Host "Starting emulator: $firstAvd" -ForegroundColor Yellow
            Start-Process "$emulatorPath\emulator.exe" -ArgumentList "-avd", $firstAvd -WindowStyle Minimized
            Write-Host "[*] Waiting for emulator to boot (30 seconds)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            
            # Wait for device to be ready
            $maxAttempts = 12
            $attempt = 0
            while ($attempt -lt $maxAttempts) {
                if (Test-AndroidEmulator) {
                    Write-Host "[OK] Emulator is ready!" -ForegroundColor Green
                    return $true
                }
                Write-Host "Waiting for emulator... ($attempt/$maxAttempts)" -ForegroundColor Yellow
                Start-Sleep -Seconds 5
                $attempt++
            }
            Write-Host "[!] Emulator started but may not be fully ready" -ForegroundColor Yellow
            return $false
        } else {
            Write-Host "[ERROR] No Android Virtual Devices (AVD) found" -ForegroundColor Red
            Write-Host "   Please create an AVD in Android Studio" -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Host "[ERROR] Android emulator not found at: $emulatorPath" -ForegroundColor Red
        Write-Host "   Please install Android Studio and set up an emulator" -ForegroundColor Yellow
        return $false
    }
}

# Function to run Expo
function Start-ExpoApp {
    param([string]$Platform, [bool]$DoClearCache)
    
    $expoArgs = @()
    if ($DoClearCache) {
        $expoArgs += "--clear"
        Write-Host "[*] Metro cache will be cleared (fixes 'Got unexpected undefined' HMR error)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "[*] Starting Expo with platform: $Platform" -ForegroundColor Cyan
    
    switch ($Platform.ToLower()) {
        "android" {
            if (Test-AndroidEmulator) {
                Write-Host "[OK] Running on Android emulator..." -ForegroundColor Green
                npx expo start --android @expoArgs
            } else {
                Write-Host "[!] Android emulator not detected. Attempting to start..." -ForegroundColor Yellow
                if (Start-AndroidEmulator) {
                    Write-Host "[OK] Running on Android emulator..." -ForegroundColor Green
                    npx expo start --android @expoArgs
                } else {
                    Write-Host "[ERROR] Failed to start Android emulator. Falling back to web..." -ForegroundColor Red
                    Write-Host "[*] Starting on web instead..." -ForegroundColor Yellow
                    npx expo start --web @expoArgs
                }
            }
        }
        "web" {
            Write-Host "[OK] Running on web browser..." -ForegroundColor Green
            npx expo start --web @expoArgs
        }
        "ios" {
            Write-Host "[OK] Running on iOS simulator..." -ForegroundColor Green
            npx expo start --ios @expoArgs
        }
        default {
            Write-Host "[ERROR] Unknown platform: $Platform" -ForegroundColor Red
            Write-Host "   Valid options: android, web, ios" -ForegroundColor Yellow
            Write-Host "   Falling back to web..." -ForegroundColor Yellow
            npx expo start --web @expoArgs
        }
    }
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Start the app
Start-ExpoApp -Platform $Platform -DoClearCache $ClearCache
