# Technical Analysis: Frontend, YAML, and Backend Alignment

## 1. Frontend API Usage Summary

### 1.1 Environment & Auth

| Item | Source | Value |
|------|--------|--------|
| **Base URL** | `frontend/utils/apiClient.ts` | `EXPO_PUBLIC_API_URL` (fallback: `http://localhost:3000` if unset or `https://api.example.com`) |
| **Auth token** | AsyncStorage key `@auth/token` | Sent as `Authorization: Bearer <token>` on all requests via apiClient |
| **FormData uploads** | apiClient + documentService / faceVerification | No `Content-Type` header (fetch sets boundary); token still sent |

**Note:** `frontend/services/faceVerification.service.ts` uses its own base URL fallback (`EXPO_PUBLIC_API_URL ?? "https://api.example.com"`). For local dev, set `EXPO_PUBLIC_API_URL=http://localhost:3000` (or your backend URL) in the frontend `.env` so both apiClient and face verification hit the same backend.

### 1.2 API Endpoints Called by Frontend

| Method | Endpoint | Service/File | Payload / Query | Response expected |
|--------|----------|--------------|------------------|-------------------|
| GET | `/health` | (optional) | — | `{ ok: boolean }` |
| POST | `/auth/send-otp` | auth.service.ts | `{ phone: string }` | `{ success, message?, debugOtp? }` |
| POST | `/auth/verify-otp` | auth.service.ts | `{ phone, otp }` | `{ success, token?, user? }` |
| PUT | `/users/profile` | user.service.ts | `{ name, age, gender, photoUri?, email?, phone? }` | `{ success, data? }` |
| PUT | `/users/location-type` | user.service.ts | `{ locationType }` | `{ success }` |
| PUT | `/users/upi` | user.service.ts | `{ upiId, upiName }` | `{ success }` |
| POST | `/documents/upload` | documentService.ts | multipart: `docType`, `side`, `file` | `{ success, documentUrl?, error? }` |
| GET | `/documents` | documentService.ts | — | `{ success, documents: { aadhar, pan } }` |
| POST | `/verify/face` | faceVerification.service.ts | multipart `face` or JSON `{ image: base64 }` | `{ success, verified?, message? }` |
| GET | `/training/progress` | training.service.ts | — | `{ success, data: { video1..video4 } }` |
| PUT | `/training/progress` | training.service.ts | `{ video1?, video2?, video3?, video4? }` | `{ success, data }` |
| GET | `/shifts/available` | shifts.service.ts | — | `{ success, data: ShiftItem[] }` |
| POST | `/shifts/select` | shifts.service.ts | `{ selectedShifts }` | `{ success }` |
| POST | `/shifts/start` | shifts.service.ts | `{ location?, shiftId? }` | `{ success, data?: { shiftStartTime? } }` |
| POST | `/shifts/end` | shifts.service.ts | `{}` | `{ success }` |
| GET | `/attendance/summary` | attendance.service.ts | query: `month`, `year` | `{ success, data: { details, ot, history } }` |
| GET | `/wallet/balance` | wallet.service.ts | — | `{ success, data: WalletBalance }` |
| POST | `/wallet/withdraw` | wallet.service.ts | `{ amount, bankAccountId, idempotencyKey? }` | `WithdrawResponse` |
| GET | `/wallet/history` | wallet.service.ts | query: `page, limit, type, status, startDate, endDate` | `{ success, data: { transactions, pagination } }` |
| GET | `/wallet/transactions/:transactionId` | wallet.service.ts | — | `{ success, data: Transaction }` |
| POST | `/bank/verify` | bank.service.ts | BankVerificationRequest | `{ success, verified, bankName?, branch?, error? }` |
| GET | `/bank/accounts` | bank.service.ts | — | `{ success, data: SavedBankAccount[] }` |
| POST | `/bank/accounts` | bank.service.ts | BankAccountDetails | `{ success, data: SavedBankAccount }` |
| PUT | `/bank/accounts/:accountId` | bank.service.ts | partial BankAccountDetails | `{ success, data: SavedBankAccount }` |
| PUT | `/bank/accounts/:accountId/set-default` | bank.service.ts | `{}` | `{ success, data: SavedBankAccount }` |
| POST | `/bank/accounts/:accountId/delete` | bank.service.ts | `{}` | — |
| GET | `/notifications` | notifications.service.ts | — | `{ success, data: ApiNotification[] }` |
| PUT | `/notifications/:id/read` | notifications.service.ts | `{}` | `{ success }` |
| PUT | `/notifications/read-all` | notifications.service.ts | `{}` | `{ success }` |
| GET | `/faqs` | faq.service.ts | — | `{ success, data: FaqItem[] }` |
| GET | `/support/tickets` | support.service.ts | — | `{ success, data: SupportTicket[] }` |
| POST | `/support/tickets` | support.service.ts | `{ category, subject, message }` | `{ success, data?: SupportTicket }` |
| POST | `/api/push-tokens` | notificationService.ts (raw fetch) | `{ token, userId?, platform, deviceId? }` | 2xx (no auth) |

---

## 2. YAML Configuration Analysis

### 2.1 application-spec.yaml

- **Servers:** `url: "${EXPO_PUBLIC_API_URL:-https://api.example.com}"` — matches frontend base URL usage.
- **Security:** Bearer JWT; matches apiClient and auth middleware.
- **Paths:** All paths used by the frontend are present (health, bank, wallet, documents, verify/face, push-tokens, samples). Auth paths are documented as comments (send-otp, verify-otp).
- **Schemas:** Align with frontend types and backend response shapes (BankVerificationResponse, WalletBalance, Transaction, DocumentFetchResponse, etc.).

**Verdict:** No missing or misconfigured keys for the current frontend. Optional: add explicit auth path definitions if you want the spec to be the single source of truth for all endpoints.

### 2.2 backend-workflow.yaml

- **APIs:** All listed APIs match backend routes (auth, users/profile, users/location-type, users/upi, documents, verify/face, training/progress, shifts, attendance, wallet, bank, notifications, faqs, support/tickets, push-tokens, samples).
- **Database collections:** Match backend models (users, otps, documents, bank_accounts, wallets, transactions, shifts, attendance, notifications, push_tokens, faqs, support_tickets, samples).
- **Validations:** Described rules align with backend validation (phone, OTP, profile, docType/side, bank, withdraw, UPI, support ticket).

**Verdict:** YAML is consistent with backend and frontend. No changes required for correctness.

### 2.3 Environment Variables

| Variable | Where used | Required |
|----------|------------|----------|
| **Frontend** | | |
| `EXPO_PUBLIC_API_URL` | apiClient, notificationService, faceVerification | Recommended (defaults differ; set for consistent backend URL) |
| **Backend** | | |
| `NODE_ENV` | env.js, otp.config, error middleware | No (default: development) |
| `PORT` | env.js, server.js | No (default: 3000) |
| `JWT_SECRET` | auth.middleware, auth.service | Yes (or use default; change in production) |
| `MONGODB_URI` | env.js, db.js | **Yes** (all API routes use requireDb; health works without DB) |
| `OTP_CONFIG_PATH` | otp.config.js | No (default: backend/config.json) |
| `OTP_DEV_MODE` | otp.config.js | No (dev OTP behavior) |
| AWS_* | S3 document uploads | Only if using S3 for documents |

---

## 3. Backend Validation

### 3.1 Route and Method Matrix

All frontend endpoints have a matching backend route and method:

- Auth: POST `/auth/send-otp`, `/auth/verify-otp` (no auth).
- User: PUT `/users/profile`, `/users/location-type`, `/users/upi` (requireAuth).
- Documents: POST `/documents/upload`, GET `/documents` (requireAuth).
- Verify: POST `/verify/face` (requireAuth).
- Training: GET/PUT `/training/progress` (requireAuth).
- Shifts: GET `/shifts/available`, POST `/shifts/select`, `/shifts/start`, `/shifts/end` (requireAuth).
- Attendance: GET `/attendance/summary` (requireAuth).
- Wallet: GET `/wallet/balance`, `/wallet/history`, `/wallet/transactions/:id`; POST `/wallet/withdraw` (requireAuth).
- Bank: POST `/bank/verify`, GET/POST/PUT `/bank/accounts`, PUT set-default, POST delete (requireAuth).
- Notifications: GET `/notifications`, PUT `/notifications/read-all`, PUT `/notifications/:id/read` (requireAuth). Route order is correct (read-all before `:id/read`).
- FAQs: GET `/faqs` (no auth).
- Support: GET/POST `/support/tickets` (requireAuth).
- Push: POST `/api/push-tokens` (no auth).
- Samples: GET/POST `/api/samples`, GET `/api/samples/:id` (no auth).

### 3.2 Request/Response Shapes

- **Auth:** Backend accepts `phone` or `phoneNumber` and `otp`; returns `success`, `message`, `token`, `user`; in dev can return `otp` (frontend uses `debugOtp` in types but still works).
- **Standard success:** Backend uses `success(res, data)` → `{ success: true, data }`. Frontend expects `{ success, data }` for list/get/create/update where applicable. Aligned.
- **Documents list:** Backend returns `{ success, documents }`; frontend expects `DocumentFetchResponse` with `documents`. Aligned.
- **Withdraw:** Backend returns `{ success, transactionId, amount, status, ... }`; frontend expects `WithdrawResponse`. Aligned.
- **Errors:** Backend uses `error(res, message, status)` → `{ success: false, error: message }`. Frontend apiClient uses `errorData.message || errorData.error`. Aligned.

### 3.3 Backend Configuration

- **env.js:** Reads `NODE_ENV`, `PORT`, `MONGODB_URI`, AWS_* from `process.env` (dotenv). No YAML file is read at runtime; configuration is env-based.
- **db.js:** Uses `env.MONGODB_URI`; connects when URI is set; `requireDb` returns 503 when DB is not connected (all routes except `/health` are behind `requireDb`).
- **auth.middleware:** Uses `JWT_SECRET` from env; sets `req.userId` from Bearer JWT (or X-User-Id in dev).
- **OTP:** Uses config file path and env (OTP_DEV_MODE, Twilio, MSG91, etc.) per otp.config.js.

### 3.4 Integrations

- **OTP/SMS:** Config-driven (config.json + env); dev mode returns OTP in response without SMS.
- **S3:** Used for document uploads when AWS_* are set; otherwise documents can still be stored (e.g. data URL or local).
- **Face verification:** Mock implementation; returns `{ success: true, verified: true }` (no external provider).

---

## 4. Fixes Applied

1. **Backend `.env.example`**  
   - Added **`MONGODB_URI`** with a short comment so that all API routes (which use `requireDb`) work after copying `.env.example` to `.env` and setting a valid MongoDB connection string.

2. **Backend missing logic (no frontend/UI changes):**
   - **`POST /verify/face`** – Now accepts both **multipart/form-data** (field `face`) and **application/json** (`{ image: base64 }`). Added optional multer middleware so multipart is parsed; when no image is sent, returns `{ success: false, verified: false, error: "Missing face image..." }`. Verify service still returns mock success when image is present.
   - **`POST /documents/upload`** – When S3 is not configured or upload fails, **fallback to storing the file as a data URL** (base64) so document upload works without AWS.
   - **Auth `POST /auth/send-otp` and resend** – Response now includes **`debugOtp`** when OTP is returned in dev mode (same value as `otp`) so frontend types that expect `debugOtp` work without change.

No frontend or UI logic was changed.

---

## 5. Final Checklist

| Check | Status |
|-------|--------|
| All frontend API calls have a matching backend route and method | Yes |
| Request payloads and query params match backend expectations | Yes |
| Response shapes match frontend types (success/data, documents, withdraw, errors) | Yes |
| Auth: token from verify-otp stored and sent as Bearer; send-otp/verify-otp and push-tokens unauthenticated | Yes |
| Environment variables documented (EXPO_PUBLIC_API_URL frontend; MONGODB_URI, JWT_SECRET backend) | Yes |
| YAML (application-spec + backend-workflow) matches frontend and backend | Yes |
| Backend reads config from env (and OTP config file), not from YAML | Yes |
| Error handling: backend returns consistent JSON; frontend handles both `message` and `error` | Yes |
| App restart: setting MONGODB_URI and JWT_SECRET (and EXPO_PUBLIC_API_URL for frontend) gives a consistent, working setup | Yes |

---

## 6. Optional Recommendations

1. **Frontend:** Set `EXPO_PUBLIC_API_URL` in frontend `.env` (e.g. `http://localhost:3000`) so apiClient, face verification, and push token registration all use the same backend URL.
2. **Backend:** Keep using `.env` for secrets and ports; no need to read application-spec.yaml at runtime.
3. **Health:** Frontend can call GET `/health` to verify connectivity; response includes `db: true/false` for diagnostics.
4. **Auth dev:** Use `OTP_DEV_MODE=1` or equivalent in config so OTP is returned in the response for easier testing without SMS.

With the above, the frontend works end-to-end with the backend without runtime errors, and the solution is consistent across restarts when env and MongoDB are correctly configured.
