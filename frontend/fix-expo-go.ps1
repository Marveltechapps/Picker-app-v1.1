# Fix Expo Go App Issues
Write-Host "=== Expo Go Troubleshooting Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear Expo cache
Write-Host "[1/5] Clearing Expo cache..." -ForegroundColor Yellow
npx expo start --clear
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Clearing cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .\.expo
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .\node_modules\.cache
}

# Step 2: Check React version compatibility
Write-Host ""
Write-Host "[2/5] Checking React version compatibility..." -ForegroundColor Yellow
$reactVersion = (Get-Content package.json | ConvertFrom-Json).dependencies.react
Write-Host "   Current React version: $reactVersion" -ForegroundColor Cyan

if ($reactVersion -like "19.*") {
    Write-Host "   ⚠️  React 19 may have compatibility issues with Expo Go" -ForegroundColor Yellow
    Write-Host "   Consider downgrading to React 18 if issues persist" -ForegroundColor Yellow
}

# Step 3: Check for incompatible native modules
Write-Host ""
Write-Host "[3/5] Checking for native modules that may not work in Expo Go..." -ForegroundColor Yellow
$packageJson = Get-Content package.json | ConvertFrom-Json
$incompatibleModules = @(
    "react-native-vision-camera",
    "react-native-maps"
)

$foundModules = @()
foreach ($module in $incompatibleModules) {
    if ($packageJson.dependencies.PSObject.Properties.Name -contains $module) {
        $foundModules += $module
    }
}

if ($foundModules.Count -gt 0) {
    Write-Host "   ⚠️  Found modules that may not work in Expo Go:" -ForegroundColor Yellow
    foreach ($module in $foundModules) {
        Write-Host "      - $module" -ForegroundColor Yellow
    }
    Write-Host "   These require custom native code and won't work in Expo Go" -ForegroundColor Yellow
    Write-Host "   You'll need to use 'npx expo prebuild' or EAS Build" -ForegroundColor Yellow
}

# Step 4: Instructions for viewing error logs
Write-Host ""
Write-Host "[4/5] How to view error logs in Expo Go:" -ForegroundColor Yellow
Write-Host "   1. Shake your device (or press Cmd+D on iOS / Cmd+M on Android)" -ForegroundColor Cyan
Write-Host "   2. Tap 'Show Error Screen' or 'View Error Log'" -ForegroundColor Cyan
Write-Host "   3. Copy the error message and share it" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Or check the terminal where you ran 'expo start' for errors" -ForegroundColor Cyan

# Step 5: Restart instructions
Write-Host ""
Write-Host "[5/5] Next steps:" -ForegroundColor Yellow
Write-Host "   1. Stop the current Expo server (Ctrl+C)" -ForegroundColor Cyan
Write-Host "   2. Run: npx expo start --clear" -ForegroundColor Cyan
Write-Host "   3. Scan the QR code again in Expo Go" -ForegroundColor Cyan
Write-Host "   4. If still not working, check the error log (see step 4)" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
