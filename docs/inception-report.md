# Inception Report

**Smart Butchery Inventory Management System (SBIMS)**
Supervisor: Mr. Alinani Simukanga · Team: Josiphiah Simbaya, Goodson Mwenso Jr.

## 1. Purpose

Fixes the vision and scope of SBIMS, identifies the actors and the priority use
cases, records the main risks, and states the feasibility position before
Elaboration and Construction.

## 2. Vision

A system tailored to a single butchery outlet that tracks stock **by weight**,
records sales that deduct stock in real time, tracks spoilage/wastage, and gives
management a live view of stock, sales and profit — through a **cashier Android
app** and a **management web dashboard** over one REST backend.

## 3. Business case (summary)

Manual and supermarket-style systems do not handle weight-based, perishable,
cut-based stock. SBIMS reduces spoilage loss, removes manual recording errors,
speeds up the counter, and produces the sales / stock / wastage information that
owners currently lack. Tools are free and open-source; the only costs are
optional hardware (scanner, connected scale) listed in the proposal budget.
See `risk-and-feasibility.md`.

## 4. Actors

| Actor | Client | Description |
|---|---|---|
| Cashier / Shop attendant | Android app | Logs in, records weight-based sales, adds deliveries, views stock, sees daily sales |
| Manager / Admin | Web dashboard | All of the above plus meat-cut & price management, wastage review, reports, user management |
| System (time-triggered) | — | Raises low-stock alerts when a cut falls to or below its threshold |

## 5. Use cases

| ID | Use case | Priority | Client(s) | Fully dressed? |
|---|---|---|---|---|
| UC1 | Log In | High | Android + Web | ✅ |
| UC2 | Record Sale (by weight, auto stock deduction) | High | Android | ✅ — primary scenario |
| UC3 | Add Stock / Record Delivery | High | Android + Web | ✅ |
| UC4 | View Available Stock | High | Android + Web | brief |
| UC5 | Record Wastage / Spoilage | Medium | Web | ✅ |
| UC6 | Manage Meat Cuts & Prices | Medium | Web | brief |
| UC7 | Generate Reports (daily/weekly sales, profit, stock usage) | Medium | Web | ✅ |
| UC8 | Manage Users | Medium | Web | brief |
| UC9 | Low-Stock Alert | Low | Web (system-raised) | brief |

Fully-dressed descriptions in `detailed-use-cases.md`.

## 6. Architecture position

Three tiers: presentation (Android app + web dashboard) → application/domain
(Node.js/Express REST services) → data access (mysql2 query layer) → MySQL.
Clients talk to the backend over a **RESTful JSON API** with token-based auth.
See `architecture.md`.

## 7. Top risks (summary)

1. **Incorrect stock after a sale / partial failure** — write sales inside one DB
   transaction that also deducts stock; roll back together.
2. **Negative or oversold stock** — validate the requested weight against current
   stock before committing.
3. **Concurrent sales on the same cut** — lock the cut row (or use a conditional
   update) so two cashiers cannot both sell the last kg.
4. **Two deliverables for one person (web + Android)** — Josiphiah; mitigate by
   building the web dashboard first against the API, then the Android app reusing
   the same endpoints.
5. **Team of two, fixed deadline** — clear split (Goodson = backend, Josiphiah =
   clients), small vertical issues, frequent integration.

Full analysis in `risk-and-feasibility.md`.

## 8. Feasibility conclusion

Technically, economically and operationally feasible within the stated scope.
**Record Sale** (end to end: Android → API → stock deduction → confirmation) is
the architecturally significant scenario to prove first.

## 9. Team and responsibilities

| Member | Area | GitHub label |
|---|---|---|
| Goodson Mwenso Jr. | Backend: REST API, domain model, MySQL, auth, business logic, tests | `backend` |
| Josiphiah Simbaya | Web dashboard + Android POS app; project coordination; documentation set | `web`, `android` |
| Both | Shared documentation, integration, demo | `docs` |
