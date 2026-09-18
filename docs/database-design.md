# Database Design

**Smart Butchery Inventory Management System (SBIMS)**

> **To be completed by Goodson.** This file must contain: the ERD, a data
> dictionary for every table, a 1NF → 2NF → 3NF normalisation walkthrough, and
> a `CREATE TABLE` script (MySQL).
>
> **Note:** the planned tables below (`cut`, `meat_type`, `sale_line`,
> `stock_movement`, ...) do **not** match the schema actually committed at
> `backend/database/schema.sql` (`users`, `categories`, `products`,
> `stock_batches`, `sales`, `wastage` — simpler, no separate sale-line or
> movement-ledger tables). Reconcile this doc against the real schema — or
> update the real schema — as part of issue #24.

## Planned tables (from the domain model)

| Table | Purpose | Key columns |
|---|---|---|
| `app_user` | Login accounts | `username` (unique), `password_hash`, `full_name`, `role`, `active` |
| `meat_type` | Beef, Chicken, Pork, Goat | `name` (unique) |
| `cut` | A product priced per kg | `meat_type_id` (FK), `name`, `price_per_kg`, `low_stock_threshold_kg`, `available_kg`, `active` |
| `delivery` | Stock-in events | `cut_id` (FK), `weight_kg`, `cost_per_kg` (nullable), `received_at`, `received_by` (FK user) |
| `sale` | Counter transactions | `sold_at`, `cashier_id` (FK user), `total_kg`, `total_amount` |
| `sale_line` | One cut on a sale | `sale_id` (FK), `cut_id` (FK), `cut_name` (snapshot), `price_per_kg` (snapshot), `weight_kg`, `line_amount` |
| `wastage_record` | Spoilage / wastage | `cut_id` (FK), `weight_kg`, `reason`, `note`, `recorded_at`, `recorded_by` (FK user) |
| `stock_movement` | Audit ledger of every stock change | `cut_id` (FK), `type` (DELIVERY/SALE/WASTAGE/ADJUSTMENT), `weight_kg` (signed), `occurred_at`, `caused_by` (FK user), optional link to the source row |

## Design points to write up

- **Weight & money** as `DECIMAL(10,3)` for kg and `DECIMAL(12,2)` for amounts —
  never floating point.
- `cut.available_kg` is a **stored running total**; `stock_movement` is the audit
  trail from which it can be re-derived (a documented, deliberate denormalisation).
- `sale_line.cut_name` / `price_per_kg` are **snapshots** — another deliberate
  redundancy so historical sales stay correct.
- Foreign keys `ON DELETE RESTRICT` — trading and stock history is never
  cascade-deleted.
- Indexes: `cut(meat_type_id)`, `sale(sold_at)`, `sale_line(sale_id)`,
  `delivery(cut_id, received_at)`, `wastage_record(cut_id, recorded_at)`,
  `stock_movement(cut_id, occurred_at)`.

## Normalisation (to write)

Start from an unnormalised "delivery note / sales sheet" record with a repeating
group of cut lines, and take it UNF → 1NF (split the line group) → 2NF (pull
`cut` out; remove the partial dependency of cut name/price on the cut) → 3NF (pull
`meat_type` and `app_user` out; remove transitive dependencies). End at the eight
tables above, noting the two deliberate denormalisations.
