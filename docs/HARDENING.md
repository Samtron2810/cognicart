# Frontend API integration and security notes

## Backend authority

The frontend does not keep a local data store or provide mock fallbacks. Authentication, business profiles, product inventory, customers, orders, payments, WhatsApp transcripts, and platform administration are all served by the WABAC API configured in `VITE_API_URL`.

The only short-lived client state is the active React checkout basket. It is not persisted and live product records are re-fetched before checkout.

## Authentication

- The Axios client uses `withCredentials` for the backend's secure cookie support.
- The returned JWT is held in memory only for the current browser runtime and is sent as a Bearer token.
- A browser refresh revalidates the server-side session with `GET /api/auth/me`.
- Configure the backend `CLIENT_URL`/CORS policy and cookie policy for the deployed web origin.

## Payments

- Orders are created through `POST /api/orders` with an idempotency key.
- Payment initialization is handled by `POST /api/payments/initialize`.
- The browser redirects only to the `authorization_url` returned by the backend.
- Paystack webhook verification and payment reconciliation must remain server-side.

## WhatsApp

- The public webhook endpoint is `<VITE_API_URL>/whatsapp/webhook`.
- Configure Meta credentials, signature secrets, and webhook verification on the backend.
- The client can display server-recorded conversations and send authenticated outbound messages; it does not generate local message logs or emulate backend replies.

## Deployment checklist

- [ ] Set `VITE_API_URL` to the HTTPS API URL, including `/api`.
- [ ] Allow the web application origin in the backend CORS configuration.
- [ ] Use MongoDB in the backend; do not deploy its development in-memory fallback.
- [ ] Remove/disable backend development account seeding before production.
- [ ] Set Paystack and WhatsApp credentials only on the backend.
- [ ] Configure monitoring and logging in the backend or external observability platform.
