# Smart Butchery Inventory Management System (SBIMS)

A weight-based inventory management system for butcheries, with an Android cashier app, a web management dashboard, and a shared backend/database.

## Structure

- `backend/` — Node.js + Express REST API, MySQL database (Goodson)
- `android-app/` — Android cashier application (Josiphiah)
- `web-dashboard/` — Web management dashboard (Josiphiah)
- `docs/` — proposal, design docs, test plans, user manual

## Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your local MySQL credentials
mysql -u root -p < database/schema.sql
npm run dev
```

The API starts on `http://localhost:3000` by default. Health check: `GET /api/health`.

## Live deployment

The backend is deployed on Railway (Node.js app + MySQL), so the Android app and web dashboard can point at a real server instead of localhost. It auto-deploys on every push to `main`:

```
https://smart-butchery-inventory-management-system-production.up.railway.app
```

Seeded accounts for testing: `admin`/`admin123`, `cashier`/`cashier123` (change these before any real submission/demo where security matters).
