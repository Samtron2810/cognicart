# Cognicart — Telegram AI Commerce Platform Plan

## 1. Project Overview

Cognicart is a multi-tenant commerce platform for African sellers built around three sales channels that feed a single seller dashboard:

1. **Telegram conversational commerce** — each seller connects their own Telegram bot. An AI assistant answers buyers from the seller's live catalog (products, variants, prices, stock) and captures orders in chat.
2. **Public storefront** — every seller gets an SEO-friendly public store with product pages and guest checkout (name, phone, email, delivery address — no account, no password). Storefront buyers receive transactional email via Brevo.
3. **Manual order capture** — sellers log sales they close anywhere else (Instagram DMs, WhatsApp chats, phone calls, walk-ins) with catalog or custom line items, negotiated prices, offline payments, and optional inventory adjustment.

### Core idea

Sellers list products once. The same catalog powers the storefront and the Telegram bot, and manual orders reconcile against the same inventory. Every order — automatic or manual — lands in one unified dashboard with an unmistakable source badge, and revenue reporting comes from a backend summary endpoint, never client-side aggregation of a paginated list.

**WhatsApp is not an API channel.** It survives only as (a) a source-channel label for manual orders and (b) user-clicked `wa.me` share links with pre-filled text. There are no Meta credentials, WhatsApp webhooks, or automated WhatsApp messages.

---

# 2. Main Users

## Seller

- Registers and logs in normally (email + password).
- Manages catalog: products, images (Cloudinary), variants (size/color), discounts, stock.
- Connects a Telegram bot by pasting its token once; the backend registers the webhook and owns all secrets.
- Reads Telegram conversations and message history from the dashboard (read-only; the AI replies in-channel).
- Sees all orders in one list — storefront, Telegram, manual — filterable by source, status, and payment status.
- Logs and edits manual orders, records offline payments on them, and adjusts inventory.
- Runs Telegram broadcast campaigns to customer segments and triggers abandoned-order reminders.
- Shares order updates via backend-composed `wa.me` links they open themselves.

## Buyer / Customer

- **On Telegram:** chats with the seller's bot; the AI answers from live data and takes the order. Updates arrive in the same chat.
- **On the storefront:** browses without an account, checks out as a guest with name, phone, email, and address; pays with Paystack; receives email updates via Brevo.
- **Optionally:** verifies an email OTP or magic link at `/track` to get a passwordless cross-store order history. This is never required to buy.

## Platform Owner (Admin)

- Provisioned via the backend CLI (`node scripts/createAdmin.js`) — no in-app admin signup, no seeded dev admins.
- Monitors sellers, orders, customers, revenue, payouts, and platform fees.
- Sees Telegram analytics per seller: connection status, bot username, inbound/outbound/AI message counts, last activity.

---

# 3. Product Philosophy

- Calm, unified dashboards over channel chaos.
- The AI is constrained to the seller's truth: it reads the catalog through controlled tools and never invents prices, stock, or discounts.
- Buying must be frictionless: guest checkout with no forced signup; buyer identity is passwordless and strictly optional.
- The backend is the single source of truth. The frontend holds no business data beyond the in-memory cart.
- Order origins must be unmistakable — badges, filters, and per-source rules (only manual orders allow line-item editing and offline payment recording).

---

# 4. Technology Stack

## Frontend

- **React 19 + TypeScript + Vite** — SPA with `react-router-dom`.
- **Tailwind CSS 4** — warm palette (#FFFBF5 background, #0B9C74 primary green, #229ED9 Telegram blue, #E85D26 orange accents).
- **Axios** — one client with Bearer token in memory + `withCredentials` cookies. Telegram bot-management calls derive the server root from `VITE_API_URL` because those routes are mounted outside `/api`.
- **Vitest + Testing Library** — unit and component tests.

## Backend (separate repository: `Samtron2810/cognicart-backend`)

- Node.js + Express, MongoDB/Mongoose.
- Telegram Bot API webhooks (per-bot secret verification, provider message-id dedupe).
- AI sales agent with tool-calling constrained to catalog/order data.
- Paystack payments, Brevo transactional email, Cloudinary images.

---

# 5. Channels

## Telegram integration

- Seller creates a bot with @BotFather and pastes the token into the dashboard once.
- `POST /telegram/connect` validates the token, registers the webhook, and stores everything server-side. The client never persists the token and only ever sees masked status from `GET /telegram/config`.
- `DELETE /telegram/disconnect` removes the bot.
- `GET /telegram/conversations` and `GET /telegram/messages?channelUserId=...` power a read-only inbox. There is no seller composer because the backend exposes no seller send endpoint.
- Telegram routes are mounted at the server root (`/telegram/...`), wrapped in `{ success, data }` envelopes.

## Storefront

- Public routes under `/api/storefront/:identifier` (profile, categories, products, SEO payloads, sitemap).
- Checkout posts `POST /api/orders` with items, customer `{ name, phone, email, address }`, delivery address, and optional `shopperId`; the backend forces `source: "storefront"`.
- Payment via `POST /api/payments/initialize` (idempotency key) → Paystack `authorization_url` → `GET /api/payments/verify/:reference`.
- Buyers get email receipts and updates through Brevo (backend-owned).

## Manual orders

- `POST /api/orders/manual` — customer details, catalog items (`productId`, optional `variantId`, quantity, optional negotiated `price`) and/or custom items (`name`, `price`, `quantity`), delivery fee, source channel (`instagram`, `whatsapp`, `phone`, `in_person`, `other`...), source note, internal notes, expected delivery date, payment status/method/reference, `adjustInventory`.
- `PATCH /api/orders/manual/:id` — partial edit; items array replaces all items; inventory reconciles.
- `PATCH /api/orders/manual/:id/payment` — offline payment status/method/reference.
- Both endpoints 404 for automatic orders; the UI mirrors this rule (`canEditLineItems` / `canRecordOfflinePayment` helpers).

---

# 6. AI Sales Agent

- Runs on the backend against Telegram messages.
- Tool-constrained: product search, price/stock lookup, order creation, order status — all scoped to the seller.
- Never fabricates data; deterministic system messages are flagged so analytics can separate AI replies from templates.

---

# 7. Seller Dashboard Sections

### Dashboard
KPIs from `GET /api/orders/summary` (orders, gross order value, paid revenue, outstanding) with by-source / by-status / by-payment breakdowns. Never computed from a loaded page of orders.

### Products
Catalog CRUD, variants, discounts, Cloudinary uploads. Active/discount state propagates to storefront and Telegram bot instantly.

### Orders
Unified list with source badges (Storefront / Telegram / Manual + channel), tabs and filters by source, status, payment status. Manual order form for create/edit. Order detail with share actions (`GET /api/orders/:id/share` → confirmation / dispatch / payment-reminder `wa.me` links the seller opens themselves).

### Telegram
Connect/disconnect bot, masked config, open-bot deep link, conversation browser, message history.

### Campaigns
List/create Telegram campaigns; segments ALL / VIP / INACTIVE / NEW / CUSTOM with audience preview; explicit send confirmation (no scheduler exists, so no scheduled-dispatch claims); delivery and failure stats; abandoned-order reminder trigger.

### Customers
Per-seller customers with Telegram identity indicators and marketing opt-out respected in campaign audiences.

### Revenue / Settings
Paystack transactions, payout view; business profile, delivery info, bank details.

---

# 8. Buyer Order Tracking (passwordless)

- `/track` — request email OTP (`POST /api/shop/auth/request-otp`), verify (`POST /api/shop/auth/verify-otp`), or land with a magic-link token (`?t=...` → `POST /api/shop/auth/magic`).
- Session is a backend httpOnly cookie. Profile (`GET/PATCH /api/shop/me`), cross-store order list (`GET /api/shop/me/orders`), and owned order detail (`GET /api/shop/me/orders/:id`).
- Guest checkout never requires any of this.

---

# 9. Admin Sections

- **Dashboard** — platform KPIs from `GET /api/admin/stats`, including Telegram message totals.
- **Sellers** — summaries with Telegram connection status and bot username; suspend/reactivate.
- **Telegram** — per-seller bot analytics from `GET /api/admin/telegram` (inbound/outbound/AI counts, last activity).
- **Revenue / Payouts / Fee** — platform fee config and payout processing.

---

# 10. Security Principles

- Multi-tenant isolation: every query scoped by seller on the backend.
- Bot tokens: submitted once over TLS, stored server-side only, never in browser storage.
- Webhook secrets and registration: backend-owned; the client never sees them.
- Seller JWT in memory only; shopper session in httpOnly cookie; nothing sensitive in `localStorage`.
- Payments verified server-side via Paystack webhooks; the client only follows `authorization_url`.
- Automatic orders cannot be edited or marked paid through manual endpoints (enforced server-side, mirrored client-side).

---

# 11. Testing

Vitest + Testing Library cover:

- Order source badges and source/status filtering logic.
- Manual-order payload builders (catalog vs custom items, negotiated prices, inventory flag).
- Automatic-order restrictions (`canEditLineItems`, `canRecordOfflinePayment`).
- Checkout validation and payload (email required, lowercased, no WhatsApp identity fields).
- Passwordless shopper auth flows (OTP request/verify, magic link).
- Telegram connect/disconnect response handling and envelope unwrapping.
- Campaign segment/audience rules and send-state handling.
- Order sharing (`wa.me` links are share-only, composed by the backend).

`npm run lint`, `tsc -b`, `npm run build`, and `npm run test` must all pass.
