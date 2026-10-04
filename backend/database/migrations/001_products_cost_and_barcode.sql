-- Brings an existing database up to date with the products columns added in
-- schema.sql (#35 barcode, cost price for the profit report). Run once:
--   mysql -u root -p sbims < database/migrations/001_products_cost_and_barcode.sql
USE sbims;

ALTER TABLE products ADD COLUMN cost_per_kg DECIMAL(10, 2) NULL AFTER price_per_kg;
ALTER TABLE products ADD COLUMN barcode VARCHAR(50) UNIQUE NULL AFTER low_stock_threshold_kg;
