# Expo Go Compatibility

## Why "View error log" / crash in Expo Go was fixed

### Root causes addressed

1. **Unsupported native plugin in `app.json`**  
   `react-native-vision-camera` was listed as a plugin. Expo Go does not include this native module, so the project was treated as incompatible and could show "View error log" or crash.  
   **Fix:** The plugin was removed from `app.json` so the project runs in Expo Go. Camera still works in Expo Go via `expo-camera` and the existing fallback flow.

2. **Native error handler startup**  
   If `ErrorUtils` was missing or different in Expo Go, setting the global handler could throw and crash the app.  
   **Fix:** `setupNativeErrorHandling()` is wrapped in try/catch in `_layout.tsx`, and `nativeErrorHandler.ts` checks that `ErrorUtils` exists before using it.

3. **SplashScreen promise**  
   `SplashScreen.preventAutoHideAsync()` returns a Promise; an unhandled rejection could surface as an error.  
   **Fix:** A `.catch(() => {})` was added so rejections don’t bubble.

4. **Duplicate import**  
   `useLiveFaceCamera.ts` had a duplicate `Platform` import; cleaned up to avoid confusion and possible bundler issues.

## Current behavior

- **Expo Go:** No red screen; no "View error log" from the above causes. Camera/face flow uses `expo-camera` and fallbacks.
- **Web:** Unchanged; continues to work.
- **APK / dev client:** For full Vision Camera support in a built app, add the plugin back when building (see below).

## Building APK with Vision Camera

When you build a standalone APK (or dev client) and want `react-native-vision-camera`:

1. **Temporarily add the plugin back to `app.json`** (inside `expo.plugins`):

```json
[
  "react-native-vision-camera",
  {
    "cameraPermissionText": "$(PRODUCT_NAME) needs access to your Camera for live face verification.",
    "enableMicrophonePermission": false,
    "enableCodeScanner": false
  }
]
```

2. Run prebuild and build:

```bash
npx expo prebuild --clean
cd android && ./gradlew assembleRelease
```

3. After building, you can remove the plugin again from `app.json` if you want to keep testing in Expo Go without switching branches.

## Best practices to avoid Expo Go crashes

1. **No unsupported native plugins in `app.json` for Expo Go**  
   Only include plugins that are supported by Expo Go when you need to run in Expo Go. Use a separate config or add the plugin only when building native apps.

2. **Guard native module usage**  
   Use `isExpoGo()` from `@/utils/expoGoDetection` before requiring or using `react-native-vision-camera`, worklets, or other custom native modules.

3. **Safe startup code**  
   Wrap global error handlers and other startup code in try/catch so a single failure doesn’t crash the app.

4. **Handle async startup**  
   Attach `.catch()` to Promises like `SplashScreen.preventAutoHideAsync()` so unhandled rejections don’t surface as errors.

5. **Test in Expo Go first**  
   Before building APK, run the app in Expo Go to confirm there are no "View error log" or red screen issues.
