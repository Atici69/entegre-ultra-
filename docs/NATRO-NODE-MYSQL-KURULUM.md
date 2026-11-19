# Natro Node.js + MySQL deployment

This guide is for the isolated API foundation in `api/`. It does not replace the existing frontend, Firebase configuration, or marketplace credentials.

## Hosting setup
1. Create a Node.js application in the hosting control panel and select Node.js 20 or newer if offered.
2. Set the application root to the repository's `api` directory (or upload the contents of `api/` as the application root).
3. Set the startup file to `server.js` and install dependencies with `npm install`.
4. Configure the environment variables from `.env.example` in the hosting panel. Do not commit a real `.env` file.
5. Set `CORS_ORIGINS` to the exact HTTPS origins used by the web application and Android web origin, if applicable.
6. Create a MySQL database and a dedicated database user with access only to that database.

## Database initialization
1. Take a backup before applying any SQL.
2. Import `sql/001_core_schema.sql` into the newly created database.
3. Configure the database connection values in the Node.js application's environment.
4. Check `/health` and `/health/database`.

## Important limits
- Confirm the hosting plan's Node.js version, memory, process lifetime, request timeout, and background-task policy with the provider.
- Do not assume shared hosting supports long-running XML imports or scheduled workers. Large imports should be queued or run by a separately supported worker.
- Do not store raw XML documents or images in MySQL. Store normalized product data and, if supported, files in file/object storage.
- Marketplace API credentials and payment secrets must remain server-side. Never put them in Vite variables, browser code, APK assets, or Git.
- This initial schema is a foundation, not a completed migration of Firebase or Turso data. Do not point a live application at it until authentication, tenant isolation, backups, and migration tests are complete.
