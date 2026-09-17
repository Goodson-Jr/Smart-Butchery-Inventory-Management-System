# web-dashboard — Management web UI

**Owner:** Josiphiah

The web application used by management. Talks to `backend/` over HTTP.

## Screens

- **Dashboard** — total stock by meat type, today's sales (kg and revenue),
  low-stock alerts.
- **Meat cuts & categories** — manage meat types (beef, chicken, pork) and their
  cuts (beef → steak / ribs / mince; chicken → wings / thighs / breast), with
  price per kg.
- **Stock** — record deliveries (stock in), view current stock, adjust.
- **Wastage / spoilage** — record spoiled or expired meat; see wastage over time.
- **Reports** — daily / weekly sales, profit estimation, stock-usage trends.
- **Users** — manage cashier / attendant and admin accounts.

## Approach

Standalone HTML/CSS/JS app calling the backend's REST API (see
`docs/architecture.md`) — the backend is Node.js, not Java, so there's no
server-side templating option.

See the `web` GitHub issues for the breakdown.
