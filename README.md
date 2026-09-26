# WABAC web client

The WABAC web client is a React + TypeScript application for the WABAC backend. It contains **no browser-backed catalog, orders, customers, payments, demo accounts, or mock-service fallback**. Every business record displayed by the dashboard is read from the API.

## Connect the backend

1. Deploy and configure [`dansamtron/wabac-backend`](https://github.com/dansamtron/wabac-backend) with MongoDB, Paystack, and WhatsApp credentials.
2. Copy the environment example:

   ```bash
   cp .env.example .env.local
   ```

3. Set `VITE_API_URL` to the deployed backend URL including `/api`.
4. Configure the backend's `CLIENT_URL` / CORS allowlist for this application's origin.
5. Run the web client:

   ```bash
   npm ci
   npm run dev
   ```

For local development, run the backend separately on port 5000 and use the default example URL.

### Authentication

The client sends the JWT returned by `/auth/login` or `/auth/register` only in memory and also enables backend cookies with `withCredentials`. The browser does not retain credentials, user profiles, or application records in `localStorage`. For a durable cross-origin login session, host the web app and API on the same site or configure the backend cookie policy for your production domains.

### Payments and checkout

Checkout creates the order and initializes Paystack through the backend. The backend issues the Paystack authorization URL and handles payment verification/webhooks. The client does not simulate successful payments or generate placeholder customer emails.

### Required production backend configuration

The backend repository still includes an in-memory development fallback and seeded development administrator accounts when no MongoDB connection is available. For a real deployment, configure its MongoDB connection and remove/disable that development seeding in the backend deployment before exposing it publicly. This frontend branch cannot modify that separate repository.

## Commands

```bash
npm run dev      # Vite development server
npm run build    # Type-check and production build
npm run lint     # ESLint
```
