# Smart Inventory Butchery Management System (SBIMS)

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
