# High-Level Requirements

**Smart Butchery Inventory Management System (SBIMS)**

## 1. Actors

| Actor | Client | Responsibilities |
|---|---|---|
| **Cashier / Attendant** | Android app | Log in; record a weight-based sale; add a stock delivery; view stock; view today's sales |
| **Manager / Admin** | Web dashboard | All cashier actions; manage meat types, cuts and prices; record and review wastage; run reports; manage user accounts |
| **System** | — | Flag a cut as low-stock when its available weight ≤ its threshold |

## 2. Functional requirements

### Authentication & access
- **FR1** A user must log in with a username and password before any other screen.
- **FR2** Passwords are stored only as BCrypt hashes.
- **FR3** Each user has a role: CASHIER or MANAGER.
- **FR4** The Android client authenticates with a token returned at login and sent on every request.
- **FR5** Meat-cut/price management, wastage, reports and user management are MANAGER-only.

### Meat types, cuts & prices
- **FR6** A manager can add a meat type (e.g. Beef, Chicken, Pork, Goat).
- **FR7** A manager can add a cut under a meat type (e.g. Beef → Ribs / Steak / Mince) with a **price per kg** and a **low-stock threshold (kg)**.
- **FR8** A manager can change a cut's price per kg and threshold.
- **FR9** A manager can retire a cut (hide from sale) without deleting its history.

### Stock (weight-based)
- **FR10** Every cut has a current **available weight in kilograms**.
- **FR11** A user can record a **delivery** (stock in) for a cut: a weight in kg, with the date and who recorded it; this increases the cut's available weight.
- **FR12** Every change to a cut's stock (delivery, sale, wastage, manual adjustment) is written to a stock-movement ledger with the weight, timestamp, type and user.
- **FR13** A user can view current available weight per cut, grouped by meat type.

### Sales (by weight)
- **FR14** A cashier selects a cut and enters the **weight sold in kg**; the system computes the line amount as weight × price per kg.
- **FR15** A sale may contain one or more lines.
- **FR16** On completing a sale the system, in **one transaction**: records the sale and its lines (with a snapshot of the cut name and price per kg), deducts the sold weight from each cut's available weight, and writes a SALE stock-movement per line.
- **FR17** The system rejects a sale line whose weight exceeds the cut's current available weight; nothing is saved.
- **FR18** A cashier can view today's sales total (kg sold and revenue).

### Wastage / spoilage
- **FR19** A manager can record wastage for a cut: a weight in kg, a reason (SPOILAGE, EXPIRY, TRIM, OTHER), the date, and who recorded it; this decreases available weight and writes a WASTAGE movement.
- **FR20** Wastage is included in the wastage report and excluded from sales revenue.

### Reports & dashboard
- **FR21** The dashboard shows total available stock per meat type, today's sales (kg and revenue) and a list of cuts currently at or below their low-stock threshold.
- **FR22** The system produces a **daily / weekly sales report** (kg sold and revenue, by cut).
- **FR23** The system produces a **profit-estimation report** (revenue minus cost of goods, where a delivery cost per kg is recorded).
- **FR24** The system produces a **stock-usage / wastage report** over a chosen date range.

### Users
- **FR25** A manager can create, list and deactivate user accounts and set their role.

## 3. Non-functional requirements

- **NFR1 Security** — token-based API auth; role-gated sensitive actions; passwords hashed; state-changing requests protected (CSRF on the web dashboard, token on the API).
- **NFR2 Data integrity** — weights and money as fixed-point decimals; each sale/delivery/wastage is one atomic transaction; concurrent sales on one cut are serialised so stock cannot go negative.
- **NFR3 Auditability** — every stock change is in the movement ledger with user and time; sale lines snapshot the cut name and price.
- **NFR4 Availability offline-tolerance** — the Android app should show a clear error and not lose the entry when the network drops (retry on reconnect is a stretch goal).
- **NFR5 Usability** — the sell screen needs at most a cut choice and a weight; a cashier needs only a short walkthrough.
- **NFR6 Portability** — backend runs on any machine with Node.js and MySQL installed; `.env.example` documents local setup.
- **NFR7 Performance** — a sale or a stock query completes within ~1 second for a single-outlet volume.

## 4. Assumptions & constraints

- One butchery outlet, one backend instance; no multi-branch sync.
- Payment handling (cash/card) is recorded as a total only; no payment-gateway integration.
- Weighing is done on a normal scale and the weight is typed in; no scale-device integration this iteration.
- Prices are entered **per kilogram**, VAT-inclusive (rate stated in `architecture.md` if shown separately).
