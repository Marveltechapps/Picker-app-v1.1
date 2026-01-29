# Android APK Crash Fixes - Production Debugging Guide

## 🔴 Root Cause Analysis

### Why APK Crashes But Expo Go Doesn't

**Expo Go:**
- Pre-built native modules included in Expo Go app
- Native code already compiled and linked
- Error handling built into Expo Go runtime
- Development mode has better error recovery

**Production APK:**
- Native modules compiled during build
- Missing native module plugins = modules not linked
- ProGuard/R8 minification can strip native code
- No error recovery = silent crashes
- Missing permissions = native crashes

## 🎯 Critical Issues Addressed

### 1. **Missing Native Module Plugin** → ✅ Fixed
- **Was:** `react-native-vision-camera` not in `app.json` plugins → native code not linked in APK.
- **Fix:** Plugin added to `app.json`; run `npx expo prebuild --clean` then rebuild.

### 2. **No ProGuard Rules** → ✅ Fixed
- **Was:** R8/ProGuard could strip native classes → `ClassNotFoundException` in release.
- **Fix:** `android-proguard-rules.pro` + `expo-build-properties` with `extraProguardRules` in `app.json`.

### 3. **Global Error Handler** → ✅ Hardened
- **Was:** Unhandled rejections / global errors could exit app silently.
- **Fix:** `utils/nativeErrorHandler.ts` logs all errors; in release, non-fatal errors do not rethrow.

### 4. **Android Config** → ✅ Already set
- `compileSdkVersion`, `targetSdkVersion`, etc. already in `app.json` under `expo.android`.

## ✅ Fixes Applied

### 1. Added Native Module Plugin (`app.json`)
- **`react-native-vision-camera`** plugin added so native code is linked in APK (required for any code path that uses Vision Camera).
- **`expo-build-properties`** plugin with **`extraProguardRules`** pointing to `android-proguard-rules.pro`.

### 2. Android Configuration (`app.json`)
- `compileSdkVersion`, `targetSdkVersion`, `buildToolsVersion`, `minSdkVersion` already set under `expo.android`.

### 3. ProGuard Rules (`android-proguard-rules.pro` + `expo-build-properties`)
- **File:** `android-proguard-rules.pro` in project root.
- **Applied via:** `expo-build-properties` → `android.extraProguardRules`.
- Prevents R8/ProGuard from stripping: Vision Camera, Worklets, ML Kit, Reanimated, Expo Face Detector, React Native bridge.

### 4. Global Error Handler (`utils/nativeErrorHandler.ts`)
- Catches unhandled promise rejections and global JS errors.
- In release: non-fatal errors are logged only (no rethrow) to reduce crash rate.
- Safe when `ErrorUtils` is missing or minified.

### 5. Face Detector Settings (`services/faceRecognition.service.ts`)
- `getFaceDetectorSettings()` returns `undefined` if `expo-face-detector` enums are missing (e.g. minified), so CameraView runs without face detector instead of crashing.

## 🔍 How to Capture Crash Logs

### Method 1: PowerShell script (Windows)

```powershell
.\capture-crash-logs.ps1
```

- Connects via USB, clears logcat, then streams **full** logcat to `crash-logs/crash_YYYYMMDD_HHmmss.log`.
- Reproduce the crash, then press Ctrl+C.
- Script analyzes the file for FATAL EXCEPTION, ClassNotFoundException, Vision Camera, ML Kit, etc.

### Method 2: ADB Logcat (manual)

```bash
adb devices
adb logcat -c
adb logcat -v time > crash-full.log
# Reproduce crash, then Ctrl+C
# Search crash-full.log for: FATAL EXCEPTION, AndroidRuntime, ReactNativeJS, com.mrousavy.camera, com.google.mlkit, com.worklets
```

### Method 3: Android Studio Logcat

1. Open Android Studio → View → Tool Windows → Logcat.
2. Connect device, select app process or filter by package: `app.rork.mobile_ui_clone_project`.
3. Reproduce crash and look for red errors / FATAL EXCEPTION.

### Method 4: Production-mode test (before building APK)

```bash
npx expo start --no-dev --minify
# Use app; any JS errors will show in terminal.
```

## 🛠️ Rebuild and Test (REQUIRED)

After these fixes, you **must** regenerate native code and build a new APK:

### Option A: EAS Build (recommended)

```bash
# Install EAS CLI if needed: npm i -g eas-cli
eas build --platform android --profile preview
# or
eas build --platform android --profile production
```

### Option B: Local prebuild + Gradle

```bash
# Clean prebuild (regenerates android/ with new plugins)
npx expo prebuild --clean

# Build release APK
cd android
./gradlew clean
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Option C: Development build (test before release)

```bash
npx expo prebuild --clean
npx expo run:android --variant release
```

**Important:** Do not skip `prebuild --clean` after adding or changing plugins. Without it, Vision Camera and ProGuard rules will not be applied.

### 2. Check Native Module Initialization

Add safety checks in hooks:

```typescript
// In useFaceVerification.ts, useLiveFaceVerification.ts
try {
  const visionCamera = require("react-native-vision-camera");
  if (!visionCamera || !visionCamera.useCameraDevice) {
    throw new Error("Vision Camera not properly initialized");
  }
} catch (error) {
  console.error("Vision Camera initialization failed:", error);
  // Return fallback values
}
```

### 3. Add Permission Checks

Before using camera, verify permissions:

```typescript
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

const checkCameraPermission = async () => {
  const result = await check(PERMISSIONS.ANDROID.CAMERA);
  if (result !== RESULTS.GRANTED) {
    // Request permission
    const requestResult = await request(PERMISSIONS.ANDROID.CAMERA);
    return requestResult === RESULTS.GRANTED;
  }
  return true;
};
```

## 📋 Testing Checklist

- [ ] Rebuild native code after plugin changes
- [ ] Test camera features in production mode
- [ ] Check logcat for native errors
- [ ] Verify permissions are granted
- [ ] Test on multiple Android versions (API 24+)
- [ ] Test on different devices (different camera hardware)
- [ ] Monitor for memory leaks (camera not released)

## 🚨 Common Crash Scenarios

### 1. Camera Permission Denied
**Symptom:** App crashes when opening camera
**Fix:** Request permission before camera access

### 2. Native Module Not Found
**Symptom:** `ClassNotFoundException` in logcat
**Fix:** Rebuild with `npx expo prebuild --clean`

### 3. ProGuard Stripping
**Symptom:** Methods work in dev, crash in release
**Fix:** Add ProGuard rules (already done in `app.config.js`)

### 4. Memory Leak
**Symptom:** App crashes after using camera multiple times
**Fix:** Ensure camera is properly released:
```typescript
useEffect(() => {
  return () => {
    if (cameraRef.current) {
      cameraRef.current = null;
    }
  };
}, []);
```

### 5. Worklets Not Initialized
**Symptom:** Frame processor crashes
**Fix:** Check Worklets is available before using:
```typescript
if (!Worklets || !Worklets.createRunOnJS) {
  console.error("Worklets not available");
  return;
}
```

## 📝 Verification Checklist (after rebuild)

- [ ] Ran `npx expo prebuild --clean` (or EAS build) after adding plugins.
- [ ] Installed new APK on a real device (not only emulator).
- [ ] Tested: start app, open tabs, start shift flow (location → identity → face verification).
- [ ] Tested: camera permission request and face verification screen (no crash when opening camera).
- [ ] Ran `.\capture-crash-logs.ps1` while using app; no FATAL EXCEPTION in generated log.
- [ ] If crash persists: capture full logcat, search for `FATAL EXCEPTION` and the line before it (usually the cause).

## 🔗 References

- [Expo Native Modules](https://docs.expo.dev/bare/installing-unimodules/)
- [React Native Vision Camera Setup](https://react-native-vision-camera.com/docs/guides)
- [ProGuard Rules](https://developer.android.com/studio/build/shrink-code)
