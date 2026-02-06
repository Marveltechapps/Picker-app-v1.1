# Backend

Node.js + Express backend.

## Install

```bash
npm install
```

## Run

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

When no database is configured, all APIs except `GET /health` return `503 Database unavailable`.

## Environment variables

Copy `.env.example` to `.env`:

| Variable      | Description           | Default        |
|---------------|-----------------------|----------------|
| `MONGODB_URI` | MongoDB connection    | (required for DB) |
| `NODE_ENV`    | Environment           | `development`  |
| `PORT`        | Server port           | `3000`         |

## Database and seeds

**Prerequisites:** MongoDB must be running and `MONGODB_URI` must be set in `.env`.

**Run all seeds** (from the backend folder):

```bash
npm run seed
```

This seeds users, otps, shifts, faqs, samples, documents, bank_accounts, wallets, transactions, attendance, notifications, push_tokens, and support_tickets. Each seed logs `Seeded: <name> (<count>)` so you can verify document counts.

**Verify seed data** (optional):

```bash
npm run check-seeds
```
(or `node seeds/check-seeds.js`)

This connects to the DB and prints document counts for each seeded collection. Exits with code 0 only if every collection has at least one document.

## Endpoints

- `GET /health` – Health check. Response: `{ db: true }` or `{ db: false }`
- Other API routes return `503` when the database is not connected

## Requirements

- Node.js 18+
