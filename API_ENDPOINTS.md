# API Endpoints

All endpoints are relative to the backend base URL (e.g. `http://localhost:3000`).  
Routes below `/health` require the database to be connected (otherwise the API returns `503`).

**Auth:** Endpoints marked **Auth required** need a valid `Authorization: Bearer <token>` header (JWT from `/auth/verify-otp`).

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check; returns `{ ok, db }`. Does not require DB. |

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/send-otp` | No | Send OTP to phone number. |
| POST | `/auth/resend-otp` | No | Resend OTP. |
| POST | `/auth/verify-otp` | No | Verify OTP and receive JWT. |

---

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/profile` | Yes | Get current user profile. |
| PUT | `/users/profile` | Yes | Update user profile. |
| PUT | `/users/location-type` | Yes | Set user location type. |
| PUT | `/users/upi` | Yes | Set UPI details. |

---

## Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/documents/upload` | Yes | Upload a document (multipart, field `file`). |
| GET | `/documents` | Yes | List user documents. |

---

## Verify

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/verify/face` | Yes | Face verification. Body: multipart (field `face`) or JSON `{ image: base64 }`. |

---

## Training

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/training/progress` | Yes | Get training progress. |
| PUT | `/training/progress` | Yes | Update training progress. |

---

## Shifts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/shifts/available` | Yes | Get available shifts. |
| POST | `/shifts/select` | Yes | Select a shift. |
| POST | `/shifts/start` | Yes | Start a shift. |
| POST | `/shifts/end` | Yes | End a shift. |

---

## Attendance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/attendance/summary` | Yes | Get attendance summary. |
| GET | `/attendance/stats` | Yes | Get attendance stats. |

---

## Wallet

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallet/balance` | Yes | Get wallet balance. |
| GET | `/wallet/earnings-breakdown` | Yes | Get earnings breakdown. |
| POST | `/wallet/withdraw` | Yes | Request withdrawal. |
| GET | `/wallet/history` | Yes | Get wallet transaction history. |
| GET | `/wallet/transactions/:transactionId` | Yes | Get a single transaction by ID. |

---

## Bank

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/bank/verify` | Yes | Verify bank details. |
| GET | `/bank/accounts` | Yes | List bank accounts. |
| POST | `/bank/accounts` | Yes | Add a bank account. |
| PUT | `/bank/accounts/:accountId` | Yes | Update a bank account. |
| PUT | `/bank/accounts/:accountId/set-default` | Yes | Set account as default. |
| POST | `/bank/accounts/:accountId/delete` | Yes | Delete a bank account. |

---

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Yes | List notifications. |
| PUT | `/notifications/read-all` | Yes | Mark all as read. |
| PUT | `/notifications/:id/read` | Yes | Mark one notification as read. |

---

## FAQs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/faqs` | No | List FAQs (public). |

---

## Support

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/support/tickets` | Yes | List support tickets. |
| POST | `/support/tickets` | Yes | Create a support ticket. |

---

## Push tokens

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/push-tokens` | No | Register push token for notifications. |

---

## Samples (example/CRUD)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/samples` | No | List all samples. |
| GET | `/api/samples/:id` | No | Get sample by ID. |
| POST | `/api/samples` | No | Create a sample. |
