# Selorg Packman — App Name & Splash Verification

## 1. App name (no hyphen)

| Location | Value |
|----------|--------|
| **Expo / app.json** | `name: "Selorg Packman"` |
| **Slug** | `selorgpackman` (no hyphen) |
| **package.json** | `"name": "selorgpackman"` |
| **Web** | `name` and `shortName`: "Selorg Packman" (title & manifest) |
| **Android** | App label from Expo `name` → "Selorg Packman" |
| **iOS** | Display name from Expo `name` → "Selorg Packman" |
| **Play Store / App Store** | Use app name from EAS build (Expo `name`) |

No hyphen anywhere; only **"Selorg Packman"** (with space) is used for display.

---

## 2. Splash screen

- **Image:** `./assets/images/splash-icon.png` (provided logo).
- **Layout:** `resizeMode: "contain"` — logo centered, not stretched or distorted.
- **Background:** Solid color `#2f8f3e` (green), non-transparent.
- **Platforms:** Expo Go, native (APK / App Store / Play Store) use the same splash config from `app.json`.

---

## 3. Logo usage (all platforms)

| Platform | Source | Notes |
|----------|--------|--------|
| **Expo Go** | `icon` + `splash` from app.json | Name and logo from config. |
| **Web** | `web.favicon`, `icon` | Title/manifest from `web.name` / `web.shortName`. |
| **Android** | `icon`, `adaptiveIcon` (foreground + background) | App label from `name`. |
| **iOS** | `icon` | Display name from `name`. |
| **Play Store / App Store** | EAS Build uses `icon` + `splash` | No code changes; config only. |

Assets used:

- `splash-icon.png` — splash screen and source for `generate-icons`.
- `icon.png` — main app icon (generated from splash-icon).
- `adaptive-foreground.png` / `adaptive-background.png` — Android adaptive icon (generated).
- `favicon.png` — web favicon (generated).

---

## 4. Assets folder structure (frontend)

```
frontend/assets/
  ASSETS_AND_APP_NAME.md
  images/
    adaptive-background.png   # Android adaptive (solid)
    adaptive-foreground.png  # Android adaptive (logo)
    favicon.png              # Web favicon
    icon.png                 # Main app icon
    splash-icon.png          # Logo; splash screen image
```

---

## 5. What was changed (config & assets only)

- **app.json:** `slug` → `selorgpackman`, `web.name` / `web.shortName` → "Selorg Packman", splash already correct.
- **package.json:** `name` → `selorgpackman`.
- **assets:** Provided logo copied to `splash-icon.png`; `npm run generate-icons` run to refresh icon, adaptive, and favicon.
- **ASSETS_AND_APP_NAME.md:** Updated for slug and splash/icon flow.

No changes to:

- Frontend UI, screens, or components
- Backend logic
- Navigation or routing

---

## 6. Quick verification

- **Expo Go:** Run `npx expo start` → name "Selorg Packman", splash with centered logo and green background.
- **Web:** Run `npx expo start --web` → page title and favicon show "Selorg Packman" and logo.
- **APK:** Build with EAS or `expo run:android` → app label and launcher icon use "Selorg Packman" and icon.
- **Play Store / App Store:** Submit build from same app.json → store listing uses same name and icons.

---

## 7. Final confirmation

- **App name:** "Selorg Packman" (space, no hyphen).
- **Logo:** Used for splash (centered, solid background) and for all app icons.
- **Splash:** Centered logo, solid background, no stretch; applied for Expo Go, APK, Play Store, and App Store builds.
