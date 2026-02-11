# Logo and Splash Screen Fix

**Single source of truth:** The app logo and splash image use one file: `./assets/images/icon.png`. App icon, native splash, in-app splash, Android adaptive icon (foreground), and web favicon all reference this image. Run `npm run generate-icons` to regenerate optional assets (favicon, adaptive-foreground/background) from `icon.png`.

---

## Root cause of the issues

### 1. App logo / splash image not updating
- **Cause:** Metro bundler and Expo caches serve old assets. Expo Go and web use the cached bundle; native builds (APK) embed assets at build time.
- **Why it seemed unchanged:** Running `npx expo start` without `--clear` keeps the previous icon and splash image in cache, so updates to `icon.png` were not reflected.

### 2. Splash screen duration not staying 3–4 seconds
- **Cause:** In `app/splash.tsx`, `ExpoSplashScreen.hideAsync()` was called **immediately** in a `useEffect` with an empty dependency array when the splash route mounted. That hid the native splash (from `app.json`) right away instead of keeping it visible.
- **Why it didn’t stay:** No minimum display time was enforced; the native splash was hidden as soon as the splash screen component mounted.

### 3. Changes not reflected in Expo Go, Web, APK
- **Expo Go / Web:** Cached JS and assets; need a clean start with cache cleared.
- **APK:** Icon and splash are baked in at build time; a new build is required after changing assets or `app.json` splash/icon.

---

## Fixes applied

### A. Splash duration (critical)
- **File:** `app/splash.tsx`
- **Change:** Removed the immediate `ExpoSplashScreen.hideAsync()` on mount. Added a **minimum display time** of 3.5 seconds: on mount, a `setTimeout(3500)` runs, then `ExpoSplashScreen.hideAsync()` is called. The native splash (from `app.json`) now stays visible for 3–4 seconds before the in-app splash UI is shown.
- **Constant:** `NATIVE_SPLASH_MIN_MS = 3500` (adjust to 4000 if you want 4 seconds).

### B. In-app splash aligned with native splash
- **File:** `app/splash.tsx`
- **Change:** In-app splash uses `icon.png` and background/StatusBar aligned with `app.json` (`#FFFFFF`). The transition from native splash to in-app splash is visually consistent (same image, centered, clean white background).

### C. Config (already correct)
- **File:** `app.json`
- **Verified:** `expo.icon` = `./assets/images/icon.png`, `expo.splash.image` = `./assets/images/icon.png`, `expo.splash.backgroundColor` = `#FFFFFF`, Android `adaptiveIcon.foregroundImage` = `icon.png` (no background image), `web.favicon` = `icon.png`, and `expo-splash-screen` plugin added. Single logo source: `icon.png`.

### D. Layout: enforce minimum splash time everywhere
- **File:** `app/_layout.tsx`
- **Change:** Added a global minimum splash time so the native splash is never hidden before 3.5s, even when the loading UI would otherwise show (e.g. in dev builds when auth is loading). A `splashMinTimeReached` state is set to `true` after `NATIVE_SPLASH_MIN_MS` (3500ms). All `SplashScreen.hideAsync()` calls in the layout are gated on `splashMinTimeReached`, so Expo Go, web, and APK all keep the native splash visible for 3–4 seconds.

### E. Cache and scripts
- **File:** `package.json`
- **Change:** Added script `"clear-cache": "npx expo start --clear"` so you can start with a clean cache in one command.

---

## Files modified

| File | Changes |
|------|--------|
| `app/splash.tsx` | Use `icon.png`; splash duration 3.5s before hide; background/StatusBar set to `#FFFFFF` |
| `app/_layout.tsx` | Enforce 3.5s minimum before any `hideAsync()`; gate all hide calls on `splashMinTimeReached` |
| `package.json` | Added `clear-cache` script |
| `LOGO_AND_SPLASH_FIX.md` | This doc: root cause, fixes, commands, verification |

---

## Commands to run

### 1. Clear cache and run (Expo Go / Web)
From the `frontend` folder:

```bash
npx expo start --clear
```

Or:

```bash
npm run clear-cache
```

Then choose Expo Go or web. **Always use `--clear` after changing `icon.png` or splash/icon config** so the new assets are picked up.

### 2. Optional: full cache reset
If the logo or splash still doesn’t update:

```bash
# From frontend/
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start --clear
```

### 3. Android APK / build
Icon and splash are embedded at build time. After changing assets or `app.json`:

```bash
# From frontend/
eas build -p android --profile preview-apk
```

Or for a development build:

```bash
npx expo prebuild --clean
npx expo run:android
```

---

## How to verify the fix

| Check | How |
|-------|-----|
| **Splash appears immediately** | Launch the app; the native splash (white background + logo from `app.json`) should show right away. |
| **Splash stays 3–4 seconds** | Time from launch until the native splash disappears; it should stay for about 3.5 seconds, then the in-app splash (same image, centered, white background) appears until redirect. |
| **Logo on splash** | Both the native splash and the in-app splash screen show the same logo (`icon.png`). |
| **App icon** | After a clean start or new build, the device launcher icon and Expo Go app tile show `icon.png`. |
| **Expo Go** | Run `npx expo start --clear`, open in Expo Go; confirm app name "Selorg Packman", splash duration, and logo. |
| **Web** | Run `npx expo start --web --clear` (or `npx expo start --clear` then choose web); check tab title and favicon. |
| **APK** | Build a new APK after changing assets; install and check launcher icon and splash on cold start. |

---

## Asset checklist

- **Single source:** `./assets/images/icon.png` — used for app icon, splash (native + in-app), Android adaptive icon foreground, and web favicon.
- **Optional generated (from `icon.png`):** Run `npm run generate-icons` (from `frontend/`) to regenerate `favicon.png`, `adaptive-foreground.png`, and `adaptive-background.png`. The app uses `icon.png` + `backgroundColor` for Android adaptive icon; generated files are optional.
- **Format:** PNG, square (1024×1024 recommended for `icon.png`).
