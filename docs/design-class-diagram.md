# Design Class Diagram

**Smart Butchery Inventory Management System (SBIMS)**

> **To be produced by Goodson after the backend design is fixed.** Unlike the
> domain model, this is the *software* view: route handlers, services, and
> the data-access layer, with their operations and dependencies.

## Expected shape

**Data model** (`backend/database/schema.sql`): `users`, `categories`,
`products`, `stock_batches`, `sales`, `wastage`. Behaviour lives in service
functions, not on the rows themselves (plain JS objects, no ORM entities):
`recordSale(productId, quantityKg)`, `addStockBatch(productId, quantityKg)`.

**Route handlers** (`backend/src/routes/`): `authRoutes`, `productRoutes`,
`stockRoutes`, `saleRoutes`, `wastageRoutes`, `reportRoutes`, `userRoutes`,
`alertRoutes`.

**Web dashboard**: standalone HTML/CSS/JS in `web-dashboard/`, calling the
same `/api/**` endpoints as the Android app — no server-side web controllers.

**Services** (`backend/src/services/`): `authService` (issues/verifies JWTs),
`saleService` (wraps `recordSale` in a DB transaction), `stockService` (wraps
stock-batch inserts and low-stock checks in a transaction), `wastageService`,
`reportService`, `productService`, `userService`.

**Data access** (`backend/src/db/` or inline in services): parameterised
queries via `mysql2` — one module per table, mirroring the repository idea
without an ORM: `userQueries`, `productQueries`, `stockBatchQueries`,
`saleQueries`, `wastageQueries`.

## Rules to capture on the diagram

- Route handlers depend on services; services depend on the query modules;
  nothing depends on route handlers.
- A DB transaction (`connection.beginTransaction()` / `commit()` /
  `rollback()`) wraps `saleService.recordSale`, `stockService.recordDelivery`
  and `wastageService.recordWastage`.
- The stock-deduction logic lives in `saleService`, never in a route handler.

_Draw with draw.io or a Mermaid `classDiagram` once the modules exist._
