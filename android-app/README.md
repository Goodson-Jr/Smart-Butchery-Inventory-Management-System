# android — Point-of-sale app

**Owner:** Josiphiah

Android app for cashiers / shop attendants at the counter. Talks to `backend/`
over the REST API (Retrofit).

## Features

- Secure login (token stored on device).
- Select a meat type / cut.
- Enter the **weight sold** (e.g. 2.5 kg); the app shows the line price from the
  price per kg.
- Complete the sale — stock is deducted automatically on the server.
- Add new stock (record a fresh delivery).
- View available stock (simplified list).
- Quick daily-sales view (total kg sold, revenue).

## Status

Android Studio project (Java) is scaffolded with all five screens wired to a
Retrofit client: `LoginActivity`, `DashboardActivity`, `SaleEntryActivity`,
`AddStockActivity`, `StockListActivity` (see `ui/`).

The API contract (`network/ApiService.java`) is written against
`backend/database/schema.sql` but the backend only exposes `/api/health` so
far — the login/products/sales endpoints (#3-#5, #7) still need to land and
the request/response shapes confirmed with Goodson (#24). Until then, network
calls will fail against a real device/emulator.

`BASE_URL` in `network/ApiClient.java` points at `10.0.2.2:3000` (the
emulator's alias for the host machine) — update it once the backend is
deployed (#10).

To open: launch Android Studio, "Open" this `android/` folder, let it sync
(it'll fetch the Gradle wrapper on first sync since the wrapper jar isn't
committed).

See the `android` GitHub issues for the remaining breakdown.
