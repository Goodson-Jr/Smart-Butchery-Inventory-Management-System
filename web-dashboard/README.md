# web-dashboard — Management web UI

**Owner:** Josiphiah

The web application used by management. Standalone HTML/CSS/JS calling
`backend/`'s REST API directly (same origin-less setup as the Android app —
CORS is open on the backend). Mirrors the Android app's screens and visual
theme so cashiers/management see the same system either way.

## Status

Built and running against the current backend:

- `login.html` — sign in, same butchery hero-photo treatment as the Android app
- `dashboard.html` — today's kg sold / revenue tiles, low-stock browser
  notification, action rows to the other screens
- `sale.html` — product grid (barcode-scan-to-select via the browser camera,
  `html5-qrcode`), cart, checkout, printable receipt (`window.print()`)
- `add-stock.html` — product grid + quantity; admin-only per the backend's
  current role rule
- `stock.html` — stock list with category badges + low-stock flag
- `wastage.html` — product grid + quantity + reason

## Known gaps (backend-side, not this folder)

- No `POST /api/sales/batch` yet — checkout submits each cart line as its
  own `POST /api/sales` call in sequence (not atomic across the whole cart).
  Swap `sale.js`'s checkout loop for one batch call once that endpoint exists.
- `GET /api/products` doesn't return `category_name` or `barcode` yet, so
  category badges fall back to a default color and barcode scan-to-select
  never finds a match (scans fine, just nothing to match against).
- Product/category **management UI** (add/edit a cut, categories) isn't
  built here yet, even though the backend now has the write endpoints
  (`POST/PUT /api/products`, `POST /api/categories`) — next thing to add.
- Reports (daily/weekly sales, profit estimation, stock-usage trends) —
  backend doesn't have these endpoints yet either.

## To run

Open `index.html` via a local server (e.g. VS Code's Live Server extension)
— not `file://` directly, since ES module-free scripts are fine but the
camera (`getUserMedia`) needs a proper origin. Needs `backend/` running on
`localhost:3000`.

See the `web` GitHub issues for the remaining breakdown.
