# Picker App

Expo / React Native app for pickers (profile, shifts, orders, performance, etc.). This repo is **frontend only**; the root is the app source.

**Backend:** The unified API (HHD + Picker) runs from **`Desktop/Dev/Backend`**. Set `EXPO_PUBLIC_API_URL` in `.env` to your backend URL (e.g. `http://YOUR_IP:5000/picker`) so this app talks to that server.

---

## Quick start

```bash
npm install
npm start
```

Configure the API URL in `.env` (e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/picker`) or in `config/config.ts`. Run the backend from `Dev/Backend` (`npm run dev` there).

---

## Project structure

Root = app source: `app/`, `components/`, `config/`, `android/`, etc. No `frontend/` or `backend/` folder in this repo.
