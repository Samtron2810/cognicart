# Phase 10 Hardening — Cognicart

This document describes production hardening applied before public launch. All backend behavior is mirrored in mock localStorage so the frontend works without a server, but the same contracts apply when `VITE_API_URL` is set.

## 1. Input validation (`src/utils/validation.ts`)
- `isEmail`, `isStrongPassword` (8+ chars, upper + digit), `isNigerianPhone`, `sanitize`, `validateBusinessName`, `validateProductPayload`, `validateCustomer`, `validateOrderItems`, `clampRequestSize`.
- Applied in `authService.register/login`, `orderService.create`, `productService.create/update`, `businessService`, `whatsappService`, `aiService` tools.
- Request body size limited to 500KB in `api` interceptor, 50-100KB per API, images 500KB each.

## 2. Rate limiting (`src/services/rateLimitService.ts`)
Token-bucket `checkRateLimit(key, count, windowMs)` persisted in memory + localStorage.
- Auth: `register:email` 3/hr, `register:global` 10/min, `login:email` 5/5min, `login:global` 20/min
- Orders: `create` 10/min, `list/get/update` 60/min + 30/min updates
- Products: `create/update` 20/min, images limited
- Payments: `initialize` 10/min, `payWithPaystack` 3/min, `verify` 10/min
- WhatsApp: `connect` 5/min, `incoming per phone` 10/min, `outbound` 20/min, `verify` 10/min
- AI: per-customer 20/min, per-seller 200/min
- API interceptor: 30 req / 10s per method+url, returns 429 client-side

## 3. Idempotency (`src/utils/idempotency.ts`)
Deterministic key `getIdempotencyKey(payload)` SHA-like, 24h TTL, 500 entries. `X-Idempotency-Key` header injected by `api` for POST /orders and /payments. Checked in `orderService.create`, `productService.create/update`, `paymentService.initialize`. Prevents duplicate orders/payments on retry/double-submit.

## 4. Secure authentication
- Tokens stored with 7-day expiry `cognicart_token_expiry`; `api.isTokenExpired` decodes JWT exp, clears storage, redirects to /login on 401.
- In production tokens must be `httpOnly, Secure, SameSite=Strict` cookies (not localStorage). Mock notes that password is not hashed — prod must use bcrypt.
- `logout`, `persist`, `getToken` enforce expiry, log via `logger`.

## 5. CORS and security headers (`vite.config.ts`)
- Dev server sends `Access-Control-Allow-Origin:*` with `Allow-Methods/Headers` including `X-Idempotency-Key`. Prod must restrict to `https://cognicart.ng` and `https://*.cognicart.ng`.
- Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- CSP allowing `js.paystack.co`, `api.paystack.co`, `images.unsplash.com`, `res.cloudinary.com`, `unsafe-inline/eval` for Vite HMR (remove unsafe-eval in prod).

## 6. Webhook signature verification (`src/services/webhookService.ts`)
- `verifyWhatsAppSignature(payload, secret, signature)` — HMAC-SHA256 `sha256=` check, mock accepts `mock` or `verify_` prefix in dev.
- `verifyPaystackSignature(payload, signature)` — similar, expects `PAYSTACK_SECRET`.
- Wired in `whatsappService.handleIncoming` (X-Hub-Signature-256) and `paymentService.verify` (X-Paystack-Signature). Missing signature warns; invalid throws.

## 7. Tenant isolation
Every list/get/create/update filters by `sellerId` from `cognicart_seller`. Cross-seller reads return 404, cross-seller writes throw. Covered in:
- `orderService.list/getById/updateStatus` and `productService.list/getById/update/remove` and `paymentService.initialize` and AI tools `toolGetProduct/toolCreateOrder/toolCreatePayment`.
- AI context seller check resets context if mismatch.
- WhatsApp `businessPhone` mapped to sellerId; unknown phone warns and falls back to authenticated seller, not others' data.
- Tests: `scripts/tenantIsolation.js` (manual) asserts seller A cannot see seller B orders/products/transactions.

## 8. AI tool authorization (`src/services/aiService.ts`)
All tools assert `assertSellerOwns`. `createOrder` delegates to `orderService` which re-checks isolation; `createPayment` checks order owns seller. Rate limits and body size enforced before LLM call. Remote OpenAI path uses `VITE_OPENAI_API_KEY` via `api` with sanitization.

## 9. Structured logging (`src/services/logger.ts`)
JSON logger `info/warn/error/debug` with timestamp, level, message, meta, persisted to `cognicart_logs` (200 entries). Used in api interceptors, auth, orders, products, payments, WhatsApp, AI. `main.tsx` captures `window.onerror` and `unhandledrejection`. `ErrorBoundary` logs and shows reload. In prod logs should ship to Datadog/Sentry.

## 10. Backup strategy (`src/services/backupService.ts`)
- `exportAll()` collects all `cognicart_*` keys plus `cognicart_ai_*` into versioned JSON with `_exportedAt`.
- `download()` triggers file save.
- `importAll(json)` restores.
- `getMeta()` shows last export.
- Prod policy (documented in `indexSpec()`): daily `pg_dump` at 02:00 UTC, gzip to S3 `cognicart-backups-{env}`, 30-day lifecycle, cross-region copy, weekly restore drill, PITR via WAL/oplog.

## 11. DB indexes (`backupService.indexSpec()`)
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_created ON orders(seller_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_seller ON orders(seller_id, status) WHERE status IN ('Pending','Confirmed','Shipped');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_active ON products(seller_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_category ON products(seller_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_seller_ref ON transactions(seller_id, reference);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_seller_phone ON whatsapp_messages(seller_id, customer_phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_timestamp ON whatsapp_messages(seller_id, timestamp DESC);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_whatsapp_config_seller ON whatsapp_config(seller_id);
```
Mongo equivalents in same file.

## 12. Abuse protection
- Image 500KB cap, product description 2000 chars, address 200 chars, phone 20, email 200.
- Order items capped 10 per order, quantity 1-99.
- AI keyword extraction sanitized, quantity parsing bounds 1-99.
- WhatsApp body 4000 chars, filters validated, direction enum.

## Operational checklist before public launch
- [ ] Set `VITE_API_URL` to production API, restrict CORS to `cognicart.ng`.
- [ ] Replace localStorage token with httpOnly Secure cookies, enable CSRF double-submit.
- [ ] Set real `PAYSTACK_SECRET` and `WHATSAPP_APP_SECRET`, enforce signature verification server-side.
- [ ] Deploy `indexSpec` migration, enable PITR.
- [ ] Configure S3 backup lifecycle and restore drill calendar.
- [ ] Ship `cognicart_logs` to centralized sink and alert on `error` level.
- [ ] Enable Paystack webhook idempotency server-side, replay protection.
