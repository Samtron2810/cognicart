# Chatstand web client

The Chatstand web client is a React + TypeScript application for the [Chatstand backend](https://github.com/Samtron2810/chatstand-backend). It powers:

- **Telegram conversational commerce** — sellers connect their own Telegram bot; an AI assistant answers buyers from the seller's live catalog and captures orders in chat.
- **Public storefronts with guest checkout** — buyers purchase with name, phone, email and delivery address. No account or password is required. Order updates for storefront buyers are sent by email (Brevo) from the backend.
- **Manual order capture** — sellers log sales closed elsewhere (Instagram, WhatsApp chats, phone calls, in person) with catalog or custom line items, negotiated prices, offline payment status and inventory adjustment.
- **A unified order dashboard** — storefront, Telegram and manual orders side by side, badged by source, with revenue reporting from the backend's summary endpoint.
- **Telegram campaigns** — segment broadcasts to Telegram customers with delivery/failure stats and abandoned-order reminders. Audiences respect Telegram identity availability and marketing opt-outs.
- **Optional passwordless buyer accounts** — storefront buyers can request an email OTP or use a magic link at `/track` to see cross-store order history. Guest checkout always keeps working without it.

There is **no browser-backed catalog, orders, customers, payments, demo accounts, or mock-service fallback**. Every business record displayed by the dashboard is read from the API. The only client-side state is the shopping cart basket.

WhatsApp is **not** an automated channel. It appears only as (a) a selectable source channel when logging manual orders and (b) optional `wa.me` share links that open the user's own WhatsApp with pre-filled text. There are no Meta credentials, WhatsApp webhooks, or automated WhatsApp messages anywhere in this application.

## Connect the backend

1. Deploy and configure [`Samtron2810/chatstand-backend`](https://github.com/Samtron2810/chatstand-backend) with MongoDB, Paystack, Brevo, and an AI provider key.
2. Copy the environment example:

   ```bash
   cp .env.example .env.local
   ```

3. Set `VITE_API_URL` to the deployed backend URL including `/api` (Telegram bot management routes are derived automatically from the same origin).
4. Configure the backend's `CLIENT_URL` / CORS allowlist for this application's origin.
5. Run the web client:

   ```bash
   npm ci
   npm run dev
   ```

For local development, run the backend separately on port 5000 and use the default example URL.

### Accounts

- **Sellers** register and log in through the app (`/register`, `/login`).
- **Admins** are provisioned on the backend with its CLI script (`node scripts/createAdmin.js`). There are no seeded development admin accounts.
- **Buyers** never register. They check out as guests; optionally they verify an email OTP or magic link on `/track` to view order history across stores.

### Authentication

The seller/admin client sends the JWT returned by `/auth/login` or `/auth/register` only in memory and also enables backend cookies with `withCredentials`. Buyer (shopper) sessions use a separate backend httpOnly cookie issued by the passwordless OTP/magic-link flow. The browser does not retain credentials, user profiles, or application records in `localStorage`.

### Telegram bot connection

Sellers paste their bot token (from Telegram's @BotFather) once on the Telegram page. The token is submitted directly to the backend and never stored in the browser. Webhook registration, webhook secrets, and update processing are owned entirely by the backend; the client only displays masked connection status, conversations, and message history.

### Payments and checkout

Checkout creates the order and initializes Paystack through the backend. The backend issues the Paystack authorization URL and handles payment verification/webhooks. Offline payments (bank transfer, cash, POS) can be recorded only on manual orders; automatic storefront/Telegram orders cannot be manually marked paid from the client.

## Commands

```bash
npm run dev      # Vite development server
npm run build    # Type-check and production build
npm run lint     # ESLint
npm run test     # Vitest unit/component tests
npm run preview  # Preview the production build
```
