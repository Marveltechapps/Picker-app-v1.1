# 🚨 Production APK Crash - Complete Solution

## Executive Summary

Your APK crashes because **native modules are not properly configured** for production builds. Expo Go works because it has pre-built native code, but your APK needs explicit configuration.

## 🔴 Root Causes Identified

### 1. **Missing Native Module Plugin** (CRITICAL)
- `react-native-vision-camera` was NOT in `app.json` plugins
- **Impact:** Native code not linked → crashes when camera is used
- **Fix:** ✅ Added plugin configuration

### 2. **No ProGuard Rules** (CRITICAL)
- R8/ProGuard strips native module classes in release builds
- **Impact:** `ClassNotFoundException` at runtime
- **Fix:** ✅ Created `app.config.js` with ProGuard rules

### 3. **No Global Error Handler** (HIGH)
- Unhandled promise rejections crash silently
- **Impact:** App exits to home screen with no error message
- **Fix:** ✅ Added `utils/nativeErrorHandler.ts`

### 4. **Missing Android SDK Config** (MEDIUM)
- No explicit SDK versions specified
- **Impact:** Build/runtime incompatibilities
- **Fix:** ✅ Added Android config to `app.json`

## ✅ All Fixes Applied

### Files Modified:
1. ✅ `app.json` - Added **react-native-vision-camera** plugin + **expo-build-properties** (extraProguardRules)
2. ✅ `app.config.js` - Simplified; ProGuard now via expo-build-properties + `android-proguard-rules.pro`
3. ✅ `utils/nativeErrorHandler.ts` - Global error handler; release: non-fatal errors do not rethrow
4. ✅ `app/_layout.tsx` - Initialize error handling (unchanged)
5. ✅ `services/faceRecognition.service.ts` - getFaceDetectorSettings returns undefined if enums missing (APK-safe)
6. ✅ `capture-crash-logs.ps1` - Saves full logcat then analyzes

### Files Created:
- ✅ `android-proguard-rules.pro` - ProGuard rules for Vision Camera, Worklets, ML Kit, Reanimated, Expo Face Detector
- ✅ `ANDROID_APK_CRASH_FIXES.md` - Detailed debugging guide
- ✅ `capture-crash-logs.sh` - Bash script for log capture
- ✅ `capture-crash-logs.ps1` - PowerShell script for log capture

## 🛠️ Next Steps (REQUIRED)

### Step 1: Rebuild Native Code

**CRITICAL:** After adding plugins, you MUST rebuild:

```bash
# Clean and rebuild
npx expo prebuild --clean

# Build APK
cd android
./gradlew clean
./gradlew assembleRelease
```

### Step 2: Test in Production Mode First

Before building APK, test in production mode:

```bash
npx expo start --no-dev --minify
```

This simulates APK behavior and helps catch issues early.

### Step 3: Capture Crash Logs

If crash still occurs, use the log capture scripts:

**Windows (PowerShell):**
```powershell
.\capture-crash-logs.ps1
```

**Mac/Linux:**
```bash
chmod +x capture-crash-logs.sh
./capture-crash-logs.sh
```

**Manual (ADB):**
```bash
adb logcat -c
adb logcat *:E ReactNative:V ReactNativeJS:V AndroidRuntime:E
```

### Step 4: Verify Fixes

After rebuilding, verify:

1. ✅ Camera opens without crash
2. ✅ Face detection works
3. ✅ No `ClassNotFoundException` in logs
4. ✅ No silent crashes

## 🔍 How to Debug Further

### If Still Crashing:

1. **Check logcat for specific error:**
   ```bash
   adb logcat | grep -E "FATAL|AndroidRuntime|ClassNotFoundException"
   ```

2. **Common errors and fixes:**

   **Error:** `ClassNotFoundException: com.mrousavy.camera.*`
   - **Cause:** ProGuard stripping
   - **Fix:** Already fixed in `app.config.js`

   **Error:** `Permission denied`
   - **Cause:** Runtime permission not granted
   - **Fix:** Check permission flow in app

   **Error:** `Native module not found`
   - **Cause:** Module not linked
   - **Fix:** Run `npx expo prebuild --clean`

   **Error:** `Worklet not initialized`
   - **Cause:** Worklets core not available
   - **Fix:** Check babel.config.js has worklets plugin

3. **Test specific features:**
   - Camera permission request
   - Camera device initialization
   - Face detector initialization
   - Frame processor creation

## 📋 Verification Checklist

Before building final APK:

- [ ] `app.json` has `react-native-vision-camera` plugin
- [ ] `app.config.js` exists with ProGuard rules
- [ ] `utils/nativeErrorHandler.ts` is imported in `_layout.tsx`
- [ ] Rebuilt with `npx expo prebuild --clean`
- [ ] Tested in production mode (`--no-dev --minify`)
- [ ] Tested on real device (not just emulator)
- [ ] Checked logcat for errors
- [ ] Verified camera permissions are granted
- [ ] Tested face detection flow
- [ ] No crashes during normal usage

## 🎯 Expected Behavior After Fixes

✅ **App should:**
- Build without errors
- Install on device successfully
- Open camera without crashing
- Handle face detection gracefully
- Show error messages instead of silent crashes
- Log errors to console/logcat for debugging

❌ **App should NOT:**
- Exit to home screen silently
- Crash when opening camera
- Show "ClassNotFoundException"
- Crash on face detection
- Have unhandled promise rejections

## 📞 If Issues Persist

1. **Share logcat output:**
   - Run `capture-crash-logs.ps1` or `capture-crash-logs.sh`
   - Share the generated log file

2. **Check specific error:**
   - Look for `FATAL EXCEPTION` in logs
   - Identify which native module is failing
   - Check if it's permission, initialization, or ProGuard issue

3. **Verify build process:**
   - Ensure `npx expo prebuild` completed successfully
   - Check `android/app/build.gradle` has all dependencies
   - Verify ProGuard rules are applied

## 🔗 Key Files Reference

- **`app.json`** - Native module plugins + Android config
- **`app.config.js`** - ProGuard rules (prevents code stripping)
- **`utils/nativeErrorHandler.ts`** - Catches crashes
- **`ANDROID_APK_CRASH_FIXES.md`** - Detailed debugging guide
- **`capture-crash-logs.*`** - Scripts to capture crash logs

## 💡 Why This Happens

**Expo Go:**
- Native modules pre-compiled in Expo Go app
- Error handling built-in
- Development mode = better error recovery

**Production APK:**
- Native code compiled during build
- Requires explicit plugin configuration
- ProGuard can strip code if not configured
- No error recovery = silent crashes

**The Fix:**
- Configure plugins in `app.json`
- Add ProGuard rules to prevent stripping
- Add error handlers to catch crashes
- Validate native modules before use

---

**Status:** ✅ All fixes applied. **REBUILD REQUIRED** before testing.
