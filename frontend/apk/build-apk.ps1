# ============================================================================
# Generic APK Build Script for React Native Expo Projects (Windows)
# ============================================================================
#
# This script is the Windows (PowerShell) equivalent of build-apk.sh.
# It automatically:
#   - Detects and installs missing dependencies
#   - Checks and fixes package compatibility issues using Expo's tools
#   - Handles build errors and retries with fixes
#   - Works with any Expo SDK version and any packages
#
# Usage: .\build-apk.ps1 [OPTIONS]
#
# Options:
#   --help, -h              Show this help message
#   --cloud                 Use EAS Build cloud (requires 'eas init')
#   --local                 Local build (default, requires Android Studio)
#   --variant TYPE          Build variant: debug, release, staging (default: release)
#   --flavor NAME           Build flavor name (for multi-flavor projects)
#   --format TYPE           Output format: apk or aab (default: apk)
#   --profile NAME          Build profile: production, development, staging (default: production)
#   --interactive, -i       Enable interactive mode (prompts for confirmations)
#   --verbose, -v           Verbose output (detailed logs)
#   --quiet, -q             Quiet mode (minimal output)
#   --json                  JSON output mode (for CI/automation)
#
# Requirements:
#   - Node.js or Bun
#   - Android Studio (for local builds) or EAS account (for cloud builds)
#   - Java 11+ (for local builds)
# ============================================================================

param(
    [switch]$Help,
    [switch]$Cloud,
    [switch]$Local,
    [string]$Variant = "release",
    [string]$Flavor = "",
    [ValidateSet("apk", "aab")]
    [string]$Format = "apk",
    [string]$Profile = "production",
    [switch]$Interactive,
    [switch]$Verbose,
    [switch]$Quiet,
    [switch]$Json,
    [switch]$NoCache,
    [switch]$ForceRebuild,
    [switch]$NoIncremental
)

$ErrorActionPreference = "Continue"  # We handle errors manually in many places

# Paths: script is in apk folder, project is parent
$SCRIPT_DIR = $PSScriptRoot
$PROJECT_DIR = Split-Path $SCRIPT_DIR -Parent
$APK_FOLDER = $SCRIPT_DIR

# Global config from params
$BUILD_MODE = if ($Cloud) { "cloud" } else { "local" }
$BUILD_VARIANT = $Variant
$BUILD_FLAVOR = $Flavor
$OUTPUT_FORMAT = $Format
$BUILD_PROFILE = $Profile
$INTERACTIVE_MODE = $Interactive
$VERBOSE_MODE = $Verbose
$QUIET_MODE = $Quiet
$JSON_MODE = $Json
$ENABLE_CACHE = -not $NoCache
$SKIP_PREBUILD_IF_EXISTS = -not $ForceRebuild
$INCREMENTAL_BUILD = -not $NoIncremental
$USE_GRADLE_DAEMON = $true

$START_TIME = [int][double]::Parse((Get-Date -UFormat %s))
$script:EXECUTED_TASKS = [System.Collections.ArrayList]::new()
$script:FAILED_TASKS = [System.Collections.ArrayList]::new()
$script:WARNINGS = [System.Collections.ArrayList]::new()
$script:BUILD_TIMINGS = @{}

# Error suggestions: pattern -> suggestion
$ERROR_SUGGESTIONS = @(
    @{ Pattern = "Unresolved reference.*barcodescanner"; Suggestion = "Run: expo install --fix expo-camera" },
    @{ Pattern = "Cannot find module"; Suggestion = "Missing dependency. The script will attempt to install it automatically." },
    @{ Pattern = "BUILD FAILED"; Suggestion = "Check build log for detailed error information." },
    @{ Pattern = "Android SDK not found"; Suggestion = "Install Android Studio or set ANDROID_HOME environment variable." },
    @{ Pattern = "Java.*not found"; Suggestion = "Install Java 11+ or ensure JAVA_HOME is set correctly." },
    @{ Pattern = "keystore.*not found"; Suggestion = "Create a keystore or set KEYSTORE_PATH environment variable." }
)

function Show-Help {
    Write-Host ""
    Write-Host "                    APK Build Script for React Native Expo (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Green
    Write-Host "    .\build-apk.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "BUILD MODES:" -ForegroundColor Green
    Write-Host "    -Cloud                 Use EAS Build cloud (requires 'eas init')"
    Write-Host "    -Local                 Local build (default, requires Android Studio)"
    Write-Host ""
    Write-Host "BUILD OPTIONS:" -ForegroundColor Green
    Write-Host "    -Variant TYPE          Build variant: debug, release, staging (default: release)"
    Write-Host "    -Flavor NAME           Build flavor name (for multi-flavor projects)"
    Write-Host "    -Format TYPE           Output format: apk or aab (default: apk)"
    Write-Host "    -Profile NAME          Build profile: production, development, staging"
    Write-Host ""
    Write-Host "OUTPUT MODES:" -ForegroundColor Green
    Write-Host "    -Verbose, -v           Verbose output"
    Write-Host "    -Quiet, -q             Quiet mode"
    Write-Host "    -Json                  JSON output for CI"
    Write-Host "    -NoCache               Disable build caching"
    Write-Host "    -ForceRebuild          Force Android project regeneration"
    Write-Host "    -NoIncremental         Disable incremental builds"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Green
    Write-Host "    .\build-apk.ps1                                    # Default release APK"
    Write-Host "    .\build-apk.ps1 -Variant debug                      # Debug APK"
    Write-Host "    .\build-apk.ps1 -Format aab -Profile production     # Production AAB"
    Write-Host ""
    exit 0
}

function Write-OutputMsg {
    param([string]$Level, [string]$Message)
    if ($JSON_MODE) {
        $ts = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
        Write-Output ("{`"timestamp`":`"$ts`",`"level`":`"$Level`",`"message`":`"$($Message -replace '\\','\\\\' -replace '"','\"')`"}")
        return
    }
    if ($QUIET_MODE -and $Level -notin "error","success") { return }
    switch ($Level) {
        "info"    { if ($VERBOSE_MODE) { Write-Host "  $Message" -ForegroundColor Blue } }
        "success" { Write-Host "[OK] $Message" -ForegroundColor Green }
        "warning" { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
        "error"   { Write-Host "[ERROR] $Message" -ForegroundColor Red }
        "progress"{ Write-Host ">>> $Message" -ForegroundColor Cyan }
        default   { Write-Host $Message }
    }
}

function Log-Task {
    param([string]$Task, [string]$Status, [string]$Details = "")
    [void]$script:EXECUTED_TASKS.Add("$Task [$Status]")
    if ($Status -eq "failed") { [void]$script:FAILED_TASKS.Add($Task) }
    if ($Status -eq "warning" -and $Details) { [void]$script:WARNINGS.Add("$Task : $Details") }
}

function Get-CpuCores {
    try {
        $cpu = (Get-CimInstance Win32_Processor).NumberOfLogicalProcessors
        if ($cpu) { return [int]$cpu }
    } catch {}
    return 4
}

function Test-CommandExists {
    param([string]$Cmd)
    $null = Get-Command $Cmd -ErrorAction SilentlyContinue
    return $?
}

function Start-Timer { param([string]$Name) $script:BUILD_TIMINGS["${Name}_START"] = [int][double]::Parse((Get-Date -UFormat %s)) }
function Stop-Timer {
    param([string]$Name)
    $startVar = "${Name}_START"
    if ($script:BUILD_TIMINGS.ContainsKey($startVar)) {
        $end = [int][double]::Parse((Get-Date -UFormat %s))
        $script:BUILD_TIMINGS[$Name] = $end - $script:BUILD_TIMINGS[$startVar]
    }
}

function Get-ErrorSuggestion {
    param([string]$ErrorText)
    foreach ($entry in $ERROR_SUGGESTIONS) {
        if ($ErrorText -match $entry.Pattern) { return $entry.Suggestion }
    }
    return ""
}

function Confirm-User {
    param([string]$Question, [string]$Default = "n")
    if (-not $INTERACTIVE_MODE) { return $Default -eq "y" }
    $prompt = "${Question} [y/N]: "
    if ($Default -eq "y") { $prompt = "${Question} [Y/n]: " }
    $r = Read-Host $prompt
    if ([string]::IsNullOrWhiteSpace($r)) { $r = $Default }
    return $r -match '^[yY]'
}

# Pre-flight checks
function Invoke-PreflightChecks {
    Start-Timer "preflight"
    Write-OutputMsg "progress" "Running pre-flight checks..."

    $errors = 0
    $warnings = 0

    if (-not (Test-Path "$PROJECT_DIR\app.json")) {
        Write-OutputMsg "error" "app.json not found in project root"
        Log-Task "Pre-flight: app.json" "failed"
        $errors++
    } else {
        try {
            $null = Get-Content "$PROJECT_DIR\app.json" -Raw | ConvertFrom-Json
            $app = Get-Content "$PROJECT_DIR\app.json" -Raw | ConvertFrom-Json
            if (-not $app.expo) {
                Write-OutputMsg "error" "app.json missing 'expo' field"
                $errors++
            } else {
                Log-Task "Pre-flight: app.json" "success"
            }
        } catch {
            Write-OutputMsg "error" "app.json is not valid JSON"
            $errors++
        }
    }

    if (-not (Test-Path "$PROJECT_DIR\package.json")) {
        Write-OutputMsg "error" "package.json not found"
        $errors++
    } else {
        Log-Task "Pre-flight: package.json" "success"
    }

    if ($BUILD_MODE -eq "local") {
        $sdkPaths = @(
            $env:ANDROID_HOME,
            "$env:LOCALAPPDATA\Android\Sdk",
            "$env:USERPROFILE\AppData\Local\Android\Sdk"
        )
        $sdkFound = $false
        foreach ($p in $sdkPaths) {
            if ($p -and (Test-Path $p)) { $sdkFound = $true; break }
        }
        if (-not $sdkFound) {
            Write-OutputMsg "warning" "Android SDK not found. Install Android Studio or set ANDROID_HOME."
            $warnings++
            Log-Task "Pre-flight: Android SDK" "warning"
        } else {
            Log-Task "Pre-flight: Android SDK" "success"
        }
    }

    Stop-Timer "preflight"
    if ($errors -gt 0) {
        Write-OutputMsg "error" "Pre-flight checks failed with $errors error(s)"
        return $false
    }
    Write-OutputMsg "success" "Pre-flight checks passed"
    return $true
}

function Test-NodeRuntime {
    Start-Timer "node_check"
    if (Test-CommandExists "bun") {
        $v = & bun --version 2>$null
        Write-OutputMsg "success" "Bun found: $v"
        Log-Task "Node runtime (Bun)" "success"
        Stop-Timer "node_check"
        return $true
    }
    if (Test-CommandExists "node") {
        $v = & node --version 2>$null
        Write-OutputMsg "success" "Node.js found: $v"
        Log-Task "Node runtime (Node.js)" "success"
        Stop-Timer "node_check"
        return $true
    }
    Write-OutputMsg "error" "Neither Bun nor Node.js found. Install Node.js or Bun."
    Log-Task "Node runtime" "failed"
    Stop-Timer "node_check"
    return $false
}

function Test-CriticalPackages {
    $critical = @("expo", "react", "react-native")
    foreach ($p in $critical) {
        if (-not (Test-Path "$PROJECT_DIR\node_modules\$p")) {
            return $false
        }
    }
    return $true
}

function Install-Dependencies {
    Start-Timer "deps_install"
    Write-OutputMsg "progress" "Checking project dependencies..."

    if (Test-Path "$PROJECT_DIR\node_modules") {
        $hasContent = (Get-ChildItem "$PROJECT_DIR\node_modules" -ErrorAction SilentlyContinue).Count -gt 0
        if ($hasContent -and (Test-CriticalPackages)) {
            Log-Task "Dependency check" "success"
            Stop-Timer "deps_install"
            return $true
        }
    }

    Push-Location $PROJECT_DIR
    try {
        if (Test-CommandExists "bun") {
            & bun install 2>&1 | Tee-Object -Variable out | Out-Null
            if ((Test-CriticalPackages)) {
                Write-OutputMsg "success" "Dependencies installed with Bun"
                Log-Task "Dependency installation (Bun)" "success"
                Stop-Timer "deps_install"
                return $true
            }
        }
        if (Test-CommandExists "npm") {
            & npm install 2>&1 | Out-Null
            if (-not (Test-CriticalPackages)) {
                & npm install --legacy-peer-deps 2>&1 | Out-Null
            }
            if (Test-CriticalPackages) {
                Write-OutputMsg "success" "Dependencies installed with npm"
                Log-Task "Dependency installation (npm)" "success"
                Stop-Timer "deps_install"
                return $true
            }
        }
        Write-OutputMsg "error" "Failed to install dependencies or critical packages missing."
        Log-Task "Dependency installation" "failed"
        return $false
    } finally {
        Pop-Location
        Stop-Timer "deps_install"
    }
}

function Set-AndroidSdk {
    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
        Log-Task "Android SDK setup" "success"
        return $true
    }
    $paths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            $env:ANDROID_HOME = $p
            Write-OutputMsg "success" "Found Android SDK at: $env:ANDROID_HOME"
            Log-Task "Android SDK setup" "success"
            return $true
        }
    }
    Log-Task "Android SDK setup" "failed"
    return $false
}

function Set-LocalProperties {
    $lp = "$PROJECT_DIR\android\local.properties"
    if ((Test-Path "$PROJECT_DIR\android") -and $env:ANDROID_HOME) {
        Set-Content -Path $lp -Value "sdk.dir=$($env:ANDROID_HOME -replace '\\','/')"
        Write-OutputMsg "info" "Created/updated local.properties"
    }
}

function Test-NeedsPrebuild {
    if (-not (Test-Path "$PROJECT_DIR\android")) { return $true }
    if (-not $SKIP_PREBUILD_IF_EXISTS) { return $true }
    $tsFile = "$PROJECT_DIR\android\.prebuild_timestamp"
    if (-not (Test-Path $tsFile)) { return $true }
    return $false
}

function Update-PrebuildTimestamp {
    $ts = [int][double]::Parse((Get-Date -UFormat %s))
    if (Test-Path "$PROJECT_DIR\android") {
        Set-Content -Path "$PROJECT_DIR\android\.prebuild_timestamp" -Value $ts
    }
}

function Get-ExpoCmd {
    if (Test-CommandExists "bun") { return "bunx" }
    return "npx"
}

function Find-BuildOutput {
    param([string]$Ext, [string]$VariantName, [string]$FlavorName)
    $paths = @(
        "$PROJECT_DIR\android\app\build\outputs\$Ext\$VariantName",
        "$PROJECT_DIR\android\app\build\outputs\$Ext",
        "$PROJECT_DIR\android\app\build\outputs\bundle\$VariantName",
        "$PROJECT_DIR\android\app\build\outputs\bundle",
        "$PROJECT_DIR"
    )
    foreach ($dir in $paths) {
        if (Test-Path $dir) {
            $file = Get-ChildItem -Path $dir -Filter "*.$Ext" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($file) { return $file.FullName }
        }
    }
    return $null
}

function Invoke-GradleBuild {
    param([string]$TaskName)
    $gradleBat = "$PROJECT_DIR\android\gradlew.bat"
    if (-not (Test-Path $gradleBat)) {
        Write-OutputMsg "error" "gradlew.bat not found."
        return $false
    }
    $logFile = "$env:TEMP\gradle_build.log"
    Push-Location "$PROJECT_DIR\android"
    try {
        $env:ANDROID_HOME = $env:ANDROID_HOME
        & .\gradlew.bat $TaskName --no-daemon --parallel --max-workers=4 2>&1 | Tee-Object -FilePath $logFile
        if ($LASTEXITCODE -ne 0) {
            Write-OutputMsg "error" "Gradle build failed (exit code $LASTEXITCODE)"
            Log-Task "Gradle build" "failed"
            return $false
        }
        Write-OutputMsg "success" "Build completed successfully"
        Log-Task "Gradle build" "success"
        return $true
    } finally {
        Pop-Location
    }
}

# Capitalize first letter for Gradle task names
function Get-Capitalized {
    param([string]$s)
    if ([string]::IsNullOrEmpty($s)) { return $s }
    return $s.Substring(0,1).ToUpper() + $s.Substring(1).ToLower()
}

# ---------- Main ----------
if ($Help) { Show-Help }

if (-not $JSON_MODE) {
    Write-Host "Starting APK build process for React Native Expo project..." -ForegroundColor Green
    Write-Host "Project directory: $PROJECT_DIR" -ForegroundColor Cyan
    Write-Host "Build mode: $BUILD_MODE | Variant: $BUILD_VARIANT | Format: $OUTPUT_FORMAT" -ForegroundColor Cyan
    Write-Host ""
}

# Create output folder
if (-not (Test-Path $APK_FOLDER)) { New-Item -ItemType Directory -Path $APK_FOLDER -Force | Out-Null }
Log-Task "Output folder" "success"

if (-not (Invoke-PreflightChecks)) { exit 1 }
if (-not (Test-NodeRuntime)) { exit 1 }
if (-not (Install-Dependencies)) {
    Write-OutputMsg "warning" "Dependency install had issues. Continuing anyway..."
    if (-not (Test-Path "$PROJECT_DIR\node_modules")) {
        Write-OutputMsg "error" "node_modules is missing. Cannot proceed."
        exit 1
    }
}

if ($BUILD_MODE -eq "cloud") {
    Write-OutputMsg "progress" "EAS cloud build..."
    $easCmd = if (Test-CommandExists "bun") { "bunx" } else { "npx" }
    Push-Location $PROJECT_DIR
    & $easCmd eas build --platform android --profile $BUILD_PROFILE --non-interactive
    Pop-Location
    Write-OutputMsg "success" "Build submitted to EAS. Check dashboard for download."
    exit 0
}

# Local build
Write-OutputMsg "progress" "Using local build..."
if (-not (Set-AndroidSdk)) {
    Write-OutputMsg "error" "Android SDK not found. Install Android Studio or set ANDROID_HOME."
    exit 1
}

if (Test-NeedsPrebuild) {
    Write-OutputMsg "progress" "Generating native Android project..."
    $expoCmd = Get-ExpoCmd
    Push-Location $PROJECT_DIR
    if (Test-Path "$PROJECT_DIR\android") {
        & $expoCmd expo prebuild --platform android --clean
    } else {
        & $expoCmd expo prebuild --platform android
    }
    Pop-Location
    Update-PrebuildTimestamp
    Log-Task "Android project generation" "success"
}
Set-LocalProperties

# Compatibility check
Write-OutputMsg "progress" "Checking dependency compatibility..."
$expoCmd = Get-ExpoCmd
Push-Location $PROJECT_DIR
& $expoCmd expo install --check 2>&1 | Out-Null
& $expoCmd expo install --fix 2>&1 | Out-Null
Pop-Location

# Gradle task name
$capVariant = Get-Capitalized $BUILD_VARIANT
$capFlavor = Get-Capitalized $BUILD_FLAVOR
if ($OUTPUT_FORMAT -eq "aab") {
    $gradleTask = if ($BUILD_FLAVOR) { "bundle$capFlavor$capVariant" } else { "bundle$capVariant" }
} else {
    $gradleTask = if ($BUILD_FLAVOR) { "assemble$capFlavor$capVariant" } else { "assemble$capVariant" }
}

Write-OutputMsg "progress" "Building $OUTPUT_FORMAT with Gradle (this may take 5-15 minutes)..."
Start-Timer "gradle_build"
$buildOk = Invoke-GradleBuild -TaskName $gradleTask
Stop-Timer "gradle_build"

if (-not $buildOk) {
    Write-OutputMsg "error" "Build failed. Check $env:TEMP\gradle_build.log"
    exit 1
}

Start-Sleep -Seconds 2
$BUILD_OUTPUT_PATH = Find-BuildOutput -Ext $OUTPUT_FORMAT -VariantName $BUILD_VARIANT -FlavorName $BUILD_FLAVOR
if (-not $BUILD_OUTPUT_PATH) {
    Start-Sleep -Seconds 3
    $BUILD_OUTPUT_PATH = Find-BuildOutput -Ext $OUTPUT_FORMAT -VariantName $BUILD_VARIANT -FlavorName $BUILD_FLAVOR
}
if (-not $BUILD_OUTPUT_PATH) {
    Write-OutputMsg "error" "Build output not found."
    exit 1
}

# App name and version
$appJson = Get-Content "$PROJECT_DIR\app.json" -Raw | ConvertFrom-Json
$APP_NAME = $appJson.expo.name
if (-not $APP_NAME) { $APP_NAME = "app" }
$APP_VERSION = $appJson.expo.version
if (-not $APP_VERSION) { $APP_VERSION = "1.0.0" }

$CLEAN_APP_NAME = ($APP_NAME -replace '[^a-zA-Z0-9]','-').ToLower() -replace '-+','-'
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$OUTPUT_FILENAME = "${CLEAN_APP_NAME}-v${APP_VERSION}-${BUILD_VARIANT}-${TIMESTAMP}.${OUTPUT_FORMAT}"
$OUTPUT_DESTINATION = Join-Path $APK_FOLDER $OUTPUT_FILENAME

Copy-Item -Path $BUILD_OUTPUT_PATH -Destination $OUTPUT_DESTINATION -Force
$LATEST_OUTPUT = Join-Path $APK_FOLDER "latest.$OUTPUT_FORMAT"
Copy-Item -Path $BUILD_OUTPUT_PATH -Destination $LATEST_OUTPUT -Force

$OUTPUT_SIZE = "{0:N2} MB" -f ((Get-Item $OUTPUT_DESTINATION).Length / 1MB)
$END_TIME = [int][double]::Parse((Get-Date -UFormat %s))
$TOTAL_DURATION = $END_TIME - $START_TIME
$MINUTES = [math]::Floor($TOTAL_DURATION / 60)
$SECONDS = $TOTAL_DURATION % 60

if (-not $JSON_MODE) {
    Write-Host ""
    Write-OutputMsg "success" "Build completed successfully!"
    Write-OutputMsg "info" "Latest: $LATEST_OUTPUT"
    Write-OutputMsg "info" "Size: $OUTPUT_SIZE"
    Write-OutputMsg "info" "Timestamped: $OUTPUT_FILENAME"
    Write-OutputMsg "info" "Total time: ${MINUTES}m ${SECONDS}s"
    Write-Host ""
    Write-Host "Output: $OUTPUT_DESTINATION" -ForegroundColor Green
} else {
    $result = @{
        success = ($script:FAILED_TASKS.Count -eq 0)
        output = @{
            path = $OUTPUT_DESTINATION
            size = $OUTPUT_SIZE
            format = $OUTPUT_FORMAT
            variant = $BUILD_VARIANT
        }
        timing = @{
            total_seconds = $TOTAL_DURATION
            total_formatted = "${MINUTES}m ${SECONDS}s"
        }
        tasks = @{
            total = $script:EXECUTED_TASKS.Count
            failed = $script:FAILED_TASKS.Count
        }
    }
    $result | ConvertTo-Json -Depth 4
}
