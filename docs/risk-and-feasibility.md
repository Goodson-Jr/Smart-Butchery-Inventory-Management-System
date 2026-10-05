# Risk and Feasibility Analysis

**Smart Butchery Inventory Management System (SBIMS)**

## 1. Feasibility

### 1.1 Technical
Standard three-tier web + mobile system on mature free tools: Node.js +
Express, MySQL (via `mysql2`), JWT + bcrypt for auth, Android Studio + Java +
Retrofit. The novel part — tracking stock by weight and deducting it on a
sale — is ordinary transactional CRUD with decimal arithmetic. The team has
JS/SQL and Java/Android background. **Feasible.**

### 1.2 Economic
All software is free and open-source. The backend and database run on one
laptop. Optional hardware in the proposal budget (handheld scanner K760,
connected weighing scale K1580, hosting K950, connectivity K100, printing K300 —
total ≈ K3690) is **not required** for the core system; those items belong to the
future-enhancements scope. **Feasible.**

### 1.3 Operational
The sell screen asks only for a cut and a weight — close to how a butcher already
works with a scale and a calculator. Managers use ordinary web forms. Training is
a short walkthrough (`user-manual.md`). **Feasible.**

### 1.4 Schedule
Two people, ~10–12 weeks (proposal timeline). Split: Goodson builds the backend
API first; Josiphiah builds the web dashboard against it, then the Android app
reusing the same endpoints. Non-core scope (barcode, scale integration, expiry
alerts, multi-branch) is deferred. **Feasible with the stated scope.**

## 2. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Residual |
|---|---|---|---|---|---|
| R1 | Sale recorded but stock not deducted (or vice-versa) on a crash | Medium | High | Sale insert + stock deduction in one DB transaction (`beginTransaction`/`commit`/`rollback`), including across a whole multi-item cart. **Confirmed**, not just designed: `tests/sales.test.js` proves a cart with one unfulfillable line rolls back every line, including ones that would have succeeded alone. | Low |
| R2 | Stock goes negative / item oversold | Medium | High | Atomic conditional `UPDATE ... WHERE stock_kg >= ?` — the check and the write are one database operation. **Confirmed**: `tests/sales.test.js` proves an oversell is rejected and leaves stock unchanged. | Low |
| R3 | Two cashiers sell the same product at once and both succeed past the last kg | Medium | Medium | Row locking (`FOR UPDATE`) and the same atomic conditional `UPDATE` make a race impossible by construction, not by timing. Not covered by an actual concurrent-request test (the suite runs serially — see `test-plan.md`), so this is a reasoned guarantee from the query pattern rather than an observed one. | Low |
| R4 | Decimal/rounding errors on weight × price | Medium | Medium | `DECIMAL` columns throughout (see `schema.sql`). **Confirmed** in `tests/sales.test.js`/`reports.test.js` — totals checked to 2-3 decimal places across sales and reports. | Low |
| R5 | Android app loses a sale when the network drops mid-request | Medium | Medium | Show a clear failure, keep the form populated, allow retry; queue-and-resync is a stretch goal | Medium |
| R6 | ~~One person owns both the web dashboard and the Android app~~ Did not materialise this way — Josiphiah built both clients. The risk that did materialise instead: **the backend got built twice in parallel** early on (both Goodson and Josiphiah wrote backend code independently) before ownership was clarified | — | — | Reviewed and adopted Josiphiah's working implementation rather than discarding it; formalised backend-only ownership going forward, with Josiphiah still proposing backend changes via PR when a new client feature needed them (reports, wastage approval, user management) and Goodson reviewing/merging each one | Low (process now established) |
| R7 | API contract drift between backend and clients | Medium | Medium | Every backend PR this cycle was reviewed against the actual schema and tested end-to-end (via Postman and, for #38, a live request trace) before the frontend coded against it; `architecture.md` kept current with real paths, not provisional ones | Low |
| R8 | Team of two — one member unavailable near the deadline | Low | High | Small independent issues on a shared GitHub issue board (30 issues tracked), frequent PRs into `main`, documentation kept current so either can pick up | Medium |
| R9 | Environment differences (Node version, MySQL, Android SDK) | Medium | Low | `.env.example` + documented setup steps in `backend/README.md`; `package-lock.json` committed; a real, automated test suite now catches environment-shaped bugs (e.g. the UTC-vs-local-time bug below) instead of relying on manual spot checks | Low |
| R10 | Server/database time zone defaulting to UTC silently mis-dates anything sold near midnight local time | Medium | Medium | **Materialised and was fixed** (PR #46): a `BUSINESS_TIMEZONE` env var (default `+02:00`) is set on every DB connection, so `DATE()`/`CURDATE()` follow the shop's day regardless of the host clock. Reproduced and confirmed with a sale inserted at exactly 23:02 UTC landing on the correct local calendar day. | Low |
| R11 | Hosting trial expiring before submission | Medium | High | Railway's free trial is time- and credit-limited and was down to **13 days / \$3.73** as of this review. Needs a decision before submission: add a payment method, or have a fallback deploy plan ready. **Not yet mitigated.** | **High — open** |

## 3. Conclusion

SBIMS is technically, economically, operationally and schedule feasible within the
scope of `problem-statement.md`. The high-impact risks (R1–R4) are no longer just
handled in the design — they are now verified by an automated test suite
(`backend/tests/`, 43 tests) that runs against a real MySQL database, not just
reasoned about. The one risk left genuinely open is R11 (hosting trial expiry),
which needs a decision from the team rather than a code change.
