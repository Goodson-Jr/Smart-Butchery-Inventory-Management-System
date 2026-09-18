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
| R1 | Sale recorded but stock not deducted (or vice-versa) on a crash | Medium | High | Sale insert + stock deduction in one DB transaction (`mysql2` connection `beginTransaction`/`commit`); rolls back together | Low |
| R2 | Stock goes negative / item oversold | Medium | High | Validate requested weight ≤ current available weight before commit; reject otherwise | Low |
| R3 | Two cashiers sell the same product at once and both succeed past the last kg | Medium | Medium | Row lock (`SELECT ... FOR UPDATE`) or a conditional `UPDATE ... WHERE stock_kg >= ?` during a sale; covered by a concurrency test | Low |
| R4 | Decimal/rounding errors on weight × price | Medium | Medium | `DECIMAL` columns throughout (see `schema.sql`), fixed scale, half-up rounding; unit tests on sale and report totals | Low |
| R5 | Android app loses a sale when the network drops mid-request | Medium | Medium | Show a clear failure, keep the form populated, allow retry; queue-and-resync is a stretch goal | Medium |
| R6 | One person owns both the web dashboard and the Android app | High | Medium | Build web first, freeze the API contract, reuse it for Android; Goodson helps on Android screens if time is short | Medium |
| R7 | API contract drift between backend and clients | Medium | Medium | Document endpoints in `architecture.md`; a Postman collection kept in the repo; integration checks before each demo | Low |
| R8 | Team of two — one member unavailable near the deadline | Low | High | Small independent issues, frequent pushes to `main`, documentation kept current so either can pick up | Medium |
| R9 | Environment differences (Node version, MySQL, Android SDK) | Medium | Low | `.env.example` + documented setup steps in `backend/README.md`; `package-lock.json` committed | Low |

## 3. Conclusion

SBIMS is technically, economically, operationally and schedule feasible within the
scope of `problem-statement.md`. The high-impact risks (R1–R4) are handled in the
design — one atomic transaction per stock-changing operation, pre-commit weight
validation, row locking, and decimal arithmetic with tests — leaving their
residual level Low.
