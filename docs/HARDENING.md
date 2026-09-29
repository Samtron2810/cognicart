# Frontend API integration and security notes

## Backend authority

The frontend does not keep a local data store or provide mock fallbacks. Authentication, business profiles, product inventory, customers, orders, payments, Telegram transcripts, campaigns, and platform administration are all served by the Cognicart API configured in `VITE_API_URL`.

The only short-lived client state is the active React checkout basket. It is not persisted and live product records are re-fetched before checkout.

## Authentication

- The Axios client uses `withCredentials` for the backend's secure cookie support.
- The seller/admin JWT is held in memory only for the current browser runtime and is sent as a Bearer token.
- A browser refresh revalidates the server-side session with `GET /api/auth/me`.
- Buyer (shopper) sessions are passwordless: email OTP or magic link, exchanged for a backend httpOnly cookie via `/api/shop/auth/*`. No buyer passwords exist anywhere.
- Admin accounts are provisioned by the backend CLI (`scripts/createAdmin.js`); there is no in-app admin signup and no seeded development admins.
- Configure the backend `CLIENT_URL`/CORS policy and cookie policy for the deployed web origin.

## Payments

- Storefront orders are created through `POST /api/orders` with an idempotency key.
- Payment initialization is handled by `POST /api/payments/initialize`.
- The browser redirects only to the `authorization_url` returned by the backend.
- Paystack webhook verification and payment reconciliation must remain server-side.
- Offline payment recording (`PATCH /api/orders/manual/:id/payment`) is manual-order-only; the backend rejects it for automatic orders and the UI never offers it for them.

## Telegram

- Sellers connect their own bot with `POST /telegram/connect` (routes mounted at the backend server root, not under `/api`). The bot token is sent once over TLS and is **never** stored in the browser — no localStorage, no client state beyond the controlled form input.
- Webhook URLs, per-bot webhook secrets, and update verification are owned by the backend. The client never sees or configures them.
- The client reads masked connection status (`GET /telegram/config`), conversations, and message history. There is no seller-side message composer because the backend exposes no seller send endpoint.
- Campaign sends (`POST /api/campaigns/:id/send`) are explicit user actions; the backend has no scheduler and the UI does not claim scheduled dispatch.

## WhatsApp

- There is no WhatsApp API integration: no Meta credentials, webhooks, access tokens, phone-number IDs, or automated messages.
- WhatsApp exists only as a manual-order source channel label and as user-clicked `wa.me` share links with pre-filled text (order sharing uses the backend `GET /api/orders/:id/share` message builder).

## Deployment checklist

- Set `VITE_API_URL` to the deployed backend `/api` URL.
- Allow the web origin in the backend CORS/cookie configuration.
- Configure Paystack, Brevo, MongoDB, and the AI provider on the backend.
- Create admin accounts with the backend CLI before first use.
