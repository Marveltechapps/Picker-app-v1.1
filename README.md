# Picker App

This repository contains two **separate projects**:

- **`frontend/`** — Expo / React Native app
- **`backend/`** — Node.js / Express API

Run and build each from its own folder. No shared source at root.

---

## Quick start

### Frontend

```bash
cd frontend
npm install
npm start
```

From repo root you can also run: `npm start` (delegates to frontend).

### Backend

```bash
cd backend
npm install
# Copy .env.example to .env and set MONGODB_URI, JWT_SECRET, etc.
npm run dev
```

From repo root: `npm run backend`

---

## Project docs

- **[frontend/README.md](frontend/README.md)** — App setup, scripts, and build
- **[backend/README.md](backend/README.md)** — API setup, env vars, seeds  
- **backend/docs/** — API endpoints, MongoDB setup, OTP workflow, specs, Postman collections

---

## Root scripts (optional)

From the repo root, `package.json` provides convenience scripts that delegate into `frontend` or `backend` (e.g. `npm start`, `npm run backend`, `npm run seed`). All real work is done inside each project folder.
