# Problem Statement

**Smart Butchery Inventory Management System (SBIMS)**
Final-year project · Supervisor: Mr. Alinani Simukanga
Team: Josiphiah Simbaya, Goodson Mwenso Jr.

## 1. Background

Butcheries deal in **perishable products sold by variable weight**, with frequent
daily transactions. Most small butcheries keep stock records manually — in
notebooks or spreadsheets — or use a general point-of-sale system built for
supermarkets that assumes items are counted, not weighed.

## 2. Problem

Traditional butchery operations face:

- Difficulty tracking meat by **weight (kg)** instead of by unit.
- Losses from **spoilage** and poor stock rotation.
- No visibility of **daily sales and stock movement**.
- Errors in manual recording of stock in / stock out.
- No proper tracking of the different **meat cuts** (e.g. ribs, steak, mince).

The result is financial loss, inefficiency and a lack of accountability.

## 3. Stakeholders

| Stakeholder | Interest |
|---|---|
| Butchery owner / manager | Accurate stock and takings, reduced spoilage loss, reports for decisions, control of staff access |
| Cashier / shop attendant | A fast way to record a sale by weight and to add a delivery |
| Customer | Correct price for the weight bought |
| Supervisor / assessor | A worked example of analysis, design and implementation, incl. a mobile client |

## 4. Objectives

**Main objective:** develop a system that enables efficient, accurate, real-time
management of butchery inventory.

**Specific objectives:**

1. Track stock based on **weight (kg)** rather than just quantity.
2. Let cashiers **record sales and deduct stock instantly**.
3. Let management **monitor stock levels and sales remotely** (web dashboard).
4. **Reduce losses** due to spoilage and mismanagement (wastage tracking).
5. Provide **reports** on sales, stock usage and wastage.

## 5. Scope

**In scope (this project):**
- Android app for cashiers: login, sell by weight, auto stock deduction, add
  stock, view stock, daily sales.
- Web dashboard for management: stock by meat type, daily sales, low-stock alerts,
  meat-cut & price management, stock in/out monitoring, wastage tracking, reports,
  user management.
- A shared Node.js/Express REST backend with a MySQL database.

**Out of scope / future enhancements** (from the proposal):
- Barcode / QR code scanning of packaged meat.
- Integration with digital weighing-scale devices.
- Expiry-date tracking with alerts.
- Multi-branch butchery management.
- A separate management mobile app.

## 6. Success criteria

- A cashier can record a weight-based sale on the Android app in under a minute,
  and the corresponding stock drops immediately.
- The web dashboard shows current stock per meat type and today's sales that
  reconcile with the recorded sale lines.
- Recorded wastage reduces the reported available stock and appears in the
  wastage report.
- Stock at or below its threshold raises a low-stock alert on the dashboard.
