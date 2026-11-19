# Entegre Ultra — Natro Node.js + MySQL deployment

This deployment guide applies to the isolated API in `api/`. The existing frontend and Android app are preserved; they are not yet fully migrated to this API.

## Hosting setup
1. Create a Node.js application in the hosting control panel and select Node.js 20 or newer.
2. Set the application root to the repository's `api` directory (or upload the contents of `api/` as the application root).
3. Set the startup file to `server.js` and install dependencies with `npm install`.
4. Add the variables from `.env.example` in the hosting panel. Never upload a real `.env` file to GitHub.
5. Set `CORS_ORIGINS` to the exact HTTPS origins used by the web frontend. Do not use a wildcard in production.
6. Create a dedicated MySQL database and a database user with access only to that database.
7. Set `JWT_SECRET` to a unique random secret of at least 32 characters in the hosting panel. Do not share it in chat, commit it, or place it in the Android app.

## Database initialization
1. Back up the target database.
2. Import `api/sql/001_core_schema.sql`.
3. Import `api/sql/002_platform_modules.sql` after 001 succeeds.
4. Configure the MySQL environment variables in the Node.js application.
5. Check `/health` and `/health/database`.

## Initial API routes
- `POST /api/auth/register` — creates a customer account and its first store.
- `POST /api/auth/login` — returns a short-lived bearer token.
- `GET /api/auth/me` — returns the authenticated account.
- `GET /api/stores` — lists only stores owned by the authenticated account.
- `GET /api/stores/:storeId/products` — lists products from an owned store.
- `POST /api/stores/:storeId/products` — creates a product in an owned store.
- `PATCH /api/stores/:storeId/products/:productId` — updates an owned store's product.

Send the token in the `Authorization: Bearer <token>` header. Registration requires `email`, `full_name`, `password` (at least 10 characters), and `store_name`. Never send real passwords or tokens to support chats.

## Current scope and deployment limits
- The new API provides account registration/login, ownership-scoped stores, and basic product CRUD. It does not yet replace all screens in the existing React/Capacitor app.
- The expanded schema prepares tables for variants, stock movements, dealer commissions, subscriptions, financial transactions, Buybox observations, sync jobs, ads, e-invoice records, and audit logs. Corresponding complete business workflows and provider integrations are not implemented merely by creating these tables.
- Marketplace, payment, and e-invoice credentials must remain server-side. No real provider keys are included.
- Confirm the hosting plan's Node.js version, memory, process lifetime, request timeout, database size quota, and background-task policy with Natro.
- Do not assume shared hosting supports long-running XML imports or scheduled workers. Large imports should be queued and processed by a separately supported worker.
- This is not yet a production-ready migration of existing Firebase/Turso data. Backups, migration rehearsal, full authorization review, integration tests, and frontend-to-API wiring remain required before live customer data is used.
