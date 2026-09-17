# Test Plan

**Smart Butchery Inventory Management System (SBIMS)**

> **To be completed by Goodson as the backend is built.** Structure below.

## 1. Approach

- **Automated (Jest or similar, against the Express app)** — the stock and
  money logic: sale deducts the right weight, insufficient-stock is rejected,
  concurrent sales on one product don't oversell, stock batches/wastage adjust
  `stock_kg` correctly, report totals add up, auth and role rules.
- **API tests (Postman collection in the repo)** — every `/api/**` endpoint:
  happy path, validation failure, unauthorised, wrong role.
- **Manual tests** — end-to-end through the Android app and the web dashboard,
  used for the demo run-through.

## 2. Automated tests to write

| Area | Cases |
|---|---|
| Sale | line amount = weight × price per kg; multi-line total; stock reduced by exactly the sold weight; SALE movements written; empty/zero-weight rejected |
| Insufficient stock | a line above `available_kg` rejects the whole sale, nothing saved |
| Concurrency | two simultaneous sales that together exceed stock — exactly one succeeds |
| Delivery | `available_kg` increases; DELIVERY movement written; ≤ 0 rejected |
| Wastage | `available_kg` decreases; WASTAGE movement written; > available rejected |
| Reports | sales report kg/revenue per cut over a range; profit = revenue − COGS; date range validated |
| Auth | login returns a token; protected endpoint 401 without it; MANAGER-only endpoint 403 for a CASHIER |
| Snapshot | a price change after a sale does not move the old `sale_line` amount |

## 3. Manual test cases (fill in during the build)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| MT1 | Android login | … | home screen for the role |
| MT2 | Sell 2.5 kg beef ribs | … | line = 2.5 × price; stock drops 2.5 kg; confirmation |
| MT3 | Oversell | sell more than in stock | rejected, stock unchanged |
| MT4 | Add delivery 10 kg | … | stock rises 10 kg |
| MT5 | Record 1 kg spoilage | … | stock drops 1 kg; shows in wastage report |
| MT6 | Dashboard reconciles | after MT2/MT4/MT5 | stock and today's sales match the actions |
| MT7 | Low-stock alert | drop a cut below its threshold | it appears in the alerts list |
| MT8 | Cashier blocked from reports | log in as cashier, call a report endpoint | 403 / not shown |

## 4. Regression

Run `./mvnw clean test` before every push to `main`.
