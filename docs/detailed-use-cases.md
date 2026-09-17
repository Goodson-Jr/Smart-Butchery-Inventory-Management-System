# Detailed Use Cases

**Smart Butchery Inventory Management System (SBIMS)**

Fully-dressed descriptions of the priority use cases. Brief entries follow.

---

## UC1 — Log In

| | |
|---|---|
| **Primary actor** | Cashier/Attendant (Android) or Manager (web) |
| **Preconditions** | The user has an active account |
| **Postconditions** | The client holds an auth token (Android) or an authenticated session (web) with the user's role |
| **Trigger** | The user opens the app / a protected page |

**Main success scenario**
1. The client shows the login screen.
2. The user enters a username and password.
3. The system finds an active account and verifies the password against its BCrypt hash.
4. The system returns a token (Android) / establishes a session (web) carrying the role.
5. The client shows the home screen for that role.

**Extensions**
- 3a. Unknown user / inactive account / wrong password → the system returns an
  authentication error; no token/session is issued.
- *a. A request without a valid token/session hits a protected endpoint → 401 /
  redirect to login.

---

## UC2 — Record Sale (by weight)

| | |
|---|---|
| **Primary actor** | Cashier (Android) |
| **Stakeholders** | Owner (accurate stock and takings), Customer (correct price for the weight) |
| **Preconditions** | The cashier is logged in; the chosen cut has stock |
| **Postconditions** | A sale + its lines are stored; each cut's `availableKg` is reduced; a SALE stock-movement is written per line — all in one transaction |
| **Trigger** | A customer buys meat at the counter |

**Main success scenario**
1. The cashier opens **New Sale**; the app lists cuts with their price per kg and available weight.
2. The cashier selects a cut and enters the **weight sold** (e.g. 2.5 kg).
3. The app shows the line amount = weight × price per kg, and adds it to the sale.
4. The cashier repeats 2–3 for further cuts if needed.
5. The cashier selects **Complete sale**.
6. The system validates every line's weight is > 0 and ≤ that cut's current `availableKg`.
7. In one transaction the system: creates the sale and its lines (snapshotting cut name and price per kg), subtracts each line's weight from the cut's `availableKg`, and writes a SALE stock-movement per line.
8. The system returns the saved sale (id, totals); the app shows a confirmation with the total kg and amount, and optionally a receipt.

**Extensions**
- 6a. A line weight exceeds the available weight → the system rejects the whole
  sale with an "insufficient stock for <cut>" error; nothing is saved.
- 6b. No lines / a zero weight → rejected.
- 7a. The transaction fails → full rollback; no sale, no stock change.
- 6c. Another cashier sold the same cut a moment earlier → the cut row is locked
  for this transaction, so the check in step 6 sees the up-to-date weight and the
  same unit cannot be sold twice.

---

## UC3 — Add Stock / Record Delivery

| | |
|---|---|
| **Primary actor** | Cashier/Attendant (Android) or Manager (web) |
| **Preconditions** | The user is logged in; the cut exists |
| **Postconditions** | The cut's `availableKg` is increased; a Delivery row and a DELIVERY stock-movement are recorded |
| **Trigger** | A fresh delivery of meat arrives |

**Main success scenario**
1. The user opens **Add Stock** and selects a cut.
2. The user enters the delivered **weight (kg)** and, optionally, a cost per kg.
3. The user submits.
4. In one transaction the system records a Delivery, adds the weight to the cut's `availableKg`, and writes a DELIVERY stock-movement.
5. The system confirms the new available weight.

**Extensions**
- 2a. Weight ≤ 0 → rejected with a message; nothing saved.

---

## UC5 — Record Wastage / Spoilage

| | |
|---|---|
| **Primary actor** | Manager (web) |
| **Preconditions** | The manager is logged in; the cut exists and has stock |
| **Postconditions** | The cut's `availableKg` is reduced; a WastageRecord and a WASTAGE stock-movement are recorded |
| **Trigger** | Meat is found spoiled, expired, or trimmed off |

**Main success scenario**
1. The manager opens **Record Wastage**, selects a cut.
2. The manager enters the wasted **weight (kg)**, a **reason** (SPOILAGE / EXPIRY / TRIM / OTHER) and an optional note.
3. The manager submits.
4. In one transaction the system records the WastageRecord, subtracts the weight from `availableKg`, and writes a WASTAGE stock-movement.
5. The wastage appears in the stock-usage report; it does not affect sales revenue.

**Extensions**
- 2a. Weight ≤ 0 or > available weight → rejected; nothing saved.

---

## UC7 — Generate Reports

| | |
|---|---|
| **Primary actor** | Manager (web) |
| **Preconditions** | The manager is logged in |
| **Postconditions** | None (read-only) |
| **Trigger** | Management wants to review performance |

**Main success scenario**
1. The manager opens **Reports** and chooses a report and a date range.
2. **Sales report** — kg sold and revenue per cut and in total over the range.
3. **Profit estimation** — revenue minus cost of goods sold (using recorded delivery cost per kg), where cost data is present.
4. **Stock-usage / wastage report** — deliveries in, sales out, wastage out and net change per cut over the range.
5. The system displays the figures; the manager can read them on screen (export is a stretch goal).

**Extensions**
- 1a. `from` after `to` → validation message, no data.
- 3a. No cost per kg recorded for some deliveries → profit is shown as
  "insufficient cost data" for those cuts.

---

## Brief use cases

| ID | Use case | Summary |
|---|---|---|
| UC4 | View Available Stock | Any logged-in user lists cuts with current `availableKg`, grouped by meat type. |
| UC6 | Manage Meat Cuts & Prices | A manager adds a meat type; adds/edits a cut with price per kg and low-stock threshold; retires a cut (soft delete). |
| UC8 | Manage Users | A manager creates, lists and deactivates accounts and sets each role. |
| UC9 | Low-Stock Alert | The dashboard lists every cut whose `availableKg ≤ lowStockThresholdKg`. |
