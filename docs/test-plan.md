# Test Plan

**Smart Butchery Inventory Management System (SBIMS)**

## 1. Approach

- **Automated (Jest + Supertest, against the real Express app and a real
  MySQL database)** — the stock and money logic: a sale deducts the right
  weight, insufficient stock is rejected, a multi-item checkout is atomic
  (all lines or none), stock-in and approved wastage adjust `stock_kg`
  correctly, report totals add up, auth and role rules, and the user-
  management safeguards (immediate token invalidation on deactivation,
  last-admin protection). Lives in `backend/tests/`, run with `npm test`
  from `backend/`.
- **Manual / exploratory** — end-to-end through the actual Android app and
  web dashboard, used for the demo run-through and for anything the
  automated suite can't reach (real UI flow, barcode scanning, visual
  layout).
- **Live production verification** — before and after each deploy, the key
  endpoints are exercised directly against the live Railway URL (not just
  locally) to confirm what's actually running matches what was tested.

## 2. Automated test suite

43 tests across 7 files, run against an isolated `sbims_test` database
(created and migrated fresh by `tests/globalSetup.js`, never touching dev or
production data) so the suite is safe to run repeatedly and never leaves
stale state behind.

| File | Covers |
|---|---|
| `auth.test.js` | Login success/failure (wrong password, unknown user); a protected route rejects a missing or garbage token; an admin-only route rejects a valid cashier token |
| `products.test.js` | `category_name` present via the join; price/category validation; a cashier cannot create a product; duplicate barcodes rejected; deactivating hides a product from the default list but not `?all=true`; `?all=true` stays active-only for a cashier |
| `stock.test.js` | Stock-in increases `stock_kg` by exactly the amount added; admin-only; non-positive quantity rejected; unknown product → 404 |
| `sales.test.js` | Single sale deducts exactly the right weight and returns the right total; oversell rejected with stock unchanged; unknown product → 404; **batch checkout**: multi-item cart deducts every line, preserves cart order in the response, correct grand total; **a cart where one line cannot be fulfilled rolls back every line, including ones that would have succeeded alone**; empty cart rejected; `/sales/today` reflects a sale just made and is open to a cashier |
| `wastage.test.js` | Cashier report is PENDING with stock unchanged; admin's own report auto-APPROVEs and deducts immediately; a cashier cannot approve (including their own report); approving deducts exactly once and a second approval is rejected; rejecting leaves stock untouched; **approval is refused if stock has since sold below the wasted amount**; a cashier sees only their own reports, an admin sees all |
| `users.test.js` | A cashier cannot list/create users; short password and invalid role rejected; duplicate usernames rejected; **deactivating a user invalidates their already-issued token immediately** (not just at next login) and blocks a fresh login with a clear message; an admin cannot demote or deactivate themselves; the last active admin cannot be removed, but it becomes possible once a second admin exists; password reset invalidates the old password and the new one works immediately |
| `reports.test.js` | All three report endpoints are admin-only; default date range is the last 7 days; profit report flags products with no `cost_per_kg` via `missing_cost_products` rather than silently costing them at zero; a sale made today shows up in both the sales and profit reports; stock-usage report correctly separates received/sold/wasted per product |

**Known gap**: the suite runs serially (`maxWorkers: 1`, by design — see
`jest.config.js`), since all test files share one `sbims_test` database.
This proves the *logic* that prevents overselling under concurrency (the
atomic conditional `UPDATE`, documented in `architecture.md` and
`database-design.md`), but it does not fire two genuinely simultaneous
requests at each other to observe the race being avoided in real time. That
would need a dedicated concurrency test issuing parallel requests against a
shared row — reasonable future work, not done this cycle.

## 3. Manual test cases

| ID | Scenario | Steps | Expected | Status |
|---|---|---|---|---|
| MT1 | Admin login (API) | `POST /api/login` with admin credentials | Token + role returned | ✅ Verified repeatedly, incl. on production |
| MT2 | Sell 2.5 kg | Admin adds 20kg beef steak, cashier sells 2.5kg | Stock drops to exactly 17.5kg | ✅ Verified locally and on production |
| MT3 | Oversell | Sell more than current stock | 409, stock unchanged | ✅ Verified (automated + manual, local and production) |
| MT4 | Add delivery | `POST /api/stock-batches` as admin | Stock rises by exactly the amount | ✅ Verified |
| MT5 | Wastage approval flow | Cashier reports 1kg spoilage, admin approves | PENDING → APPROVED, stock drops 1kg only on approval | ✅ Verified (automated + manual on production) |
| MT6 | Dashboard reconciles | After MT2/MT4/MT5 | Stock and today's sales match the actions | ✅ Verified via `/sales/today` and `/reports/*` |
| MT7 | Low-stock alert | Drop a product below its threshold | Appears in `/alerts/low-stock` | ✅ Verified |
| MT8 | Cashier blocked from reports | Cashier calls a report endpoint | 403 | ✅ Verified (automated + manual on production) |
| MT9 | Android login screen | Open the Android app, log in as cashier | Reaches the cashier home screen, token stored | ⚠️ **Not yet personally verified** — production stock levels show real sales have gone through the app at some point, which implies this works, but no one has watched it happen end-to-end through the actual screen this cycle. Tracked as issue #6. |
| MT10 | Full demo run-through | Rehearse the complete golden-path scenario live | Smooth, no surprises | ⏳ Pending — issue #27 |

## 4. Regression

Before every push to `main`:

```bash
cd backend
npm test
```

There is no CI pipeline running this automatically yet (no GitHub Actions
workflow) — it is a manual step for now. Wiring `npm test` into a GitHub
Actions workflow on every PR would be a reasonable next step if there's time
before submission.
