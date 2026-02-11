# Picker App - Frontend

Expo React Native app. Run from this directory or via root `npm start`.

```bash
npm install
npm start
```

## Expo Go: Backend API (Sign In / Send OTP)

When using **Expo Go on a physical device**, the app cannot use `localhost` — that refers to the phone. Set your computer's LAN IP in the frontend `.env`:

1. **Get your machine's IP** (same WiFi as the phone):  
   Windows: `ipconfig` → IPv4 Address  |  macOS/Linux: `ifconfig` or `ip addr`
2. **Copy** `frontend/.env.example` to `frontend/.env` and set:
   ```bash
   EXPO_PUBLIC_API_URL=http://YOUR_IP:3000
   ```
   Example: `EXPO_PUBLIC_API_URL=http://192.168.1.100:3000`
3. **Backend** must be running and bound to all interfaces (default: `0.0.0.0`). Restart the backend after changing `.env`.
4. **Restart Expo** (`npx expo start --clear`) after changing `.env` so the new URL is picked up.

Without this, "Send OTP" in Expo Go will fail with "Network request failed".

## Tunnel vs LAN (Expo Go on device)

- **Same WiFi (recommended; avoids tunnel disconnects):** Run `npm run start:lan` or `npx expo start --clear` (no tunnel). Your phone and PC must be on the same network. Scan the QR code; the app will load from your PC’s IP.
- **Different networks / cellular:** Run `npx expo start --tunnel`. This uses ngrok and works when the phone can’t reach your PC directly.

**If you see “Tunnel connection has been closed”:**  
**If you see "ngrok tunnel took too long to connect":** The project uses a 60s tunnel timeout. If it still fails, set `EXPO_TUNNEL_TIMEOUT=90000` (Windows: `set EXPO_TUNNEL_TIMEOUT=90000` then run tunnel; macOS/Linux: `EXPO_TUNNEL_TIMEOUT=90000 npx expo start --tunnel`). You can also run the [ngrok app](https://ngrok.com/download) in the background or allow it through firewall/antivirus.

Expo/ngrok tunnels can drop briefly due to network or ngrok limits. Usually you’ll see “Tunnel connected.” again shortly. If the app stops loading:
1. Wait for “Tunnel connected.” in the terminal, then reload the app (shake device → Reload), or  
2. Restart the dev server (`Ctrl+C`, then `npx expo start --tunnel` again), or  
3. Use LAN instead: same WiFi and `npx expo start` (no `--tunnel`).

## APK Build

```bash
cd apk
.\build-apk.bat    # Windows
./build-apk.sh     # macOS/Linux
```
