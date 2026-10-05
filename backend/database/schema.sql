CREATE DATABASE IF NOT EXISTS sbims;
USE sbims;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'cashier') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  cost_per_kg DECIMAL(10, 2) NULL,
  stock_kg DECIMAL(10, 3) NOT NULL DEFAULT 0,
  low_stock_threshold_kg DECIMAL(10, 3) NOT NULL DEFAULT 5,
  barcode VARCHAR(50) UNIQUE NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE stock_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_kg DECIMAL(10, 3) NOT NULL,
  received_by INT NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_kg DECIMAL(10, 3) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sold_by INT NOT NULL,
  sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sold_by) REFERENCES users(id)
);

CREATE TABLE wastage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_kg DECIMAL(10, 3) NOT NULL,
  reason ENUM('SPOILAGE', 'EXPIRY', 'TRIM', 'OTHER') NOT NULL DEFAULT 'OTHER',
  note VARCHAR(255),
  -- Cashier reports stay PENDING (no stock change) until a manager approves
  -- them, so meat can't be written off as "spoilt" without a second pair of
  -- eyes (#39). Stock is only deducted on approval.
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  recorded_by INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  rejection_reason VARCHAR(255) NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
