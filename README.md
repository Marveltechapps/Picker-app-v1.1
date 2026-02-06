# Picker App

React Native (Expo) frontend + Node/Express backend.

## Structure

```
├── backend/     # Node/Express API
├── frontend/    # Expo React Native app
```

## Quick Start

### Frontend (Expo)

```bash
cd frontend
npm install
npm start
```

Or from root: `npm start`

### Backend

```bash
cd backend
npm install
# Copy .env.example to .env, set JWT_SECRET and other vars
npm run dev
```

Or from root: `npm run backend`

## Build APK

```bash
cd frontend/apk
.\build-apk.bat          # Windows
./build-apk.sh           # macOS/Linux
```

## Environment

- **Frontend**: Set `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:3000/api`) in `.env` or `app.config.js` to point to the backend.
