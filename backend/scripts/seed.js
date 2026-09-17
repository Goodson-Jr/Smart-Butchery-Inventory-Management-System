require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

async function seed() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);

  await pool.query(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin'), (?, ?, 'cashier')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin', adminHash, 'cashier', cashierHash]
  );

  await pool.query(
    `INSERT INTO categories (name) VALUES ('Beef'), ('Chicken'), ('Pork')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`
  );

  const [categories] = await pool.query('SELECT id, name FROM categories');
  const byName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  // Barcodes use the 20-29 EAN-13 prefix range, reserved for in-store /
  // variable-weight items -- a realistic fit for a butchery.
  const products = [
    ['Steak', byName.Beef, 120.0, 20, '2000000000011'],
    ['Ribs', byName.Beef, 95.0, 15, '2000000000012'],
    ['Mince', byName.Beef, 85.0, 10, '2000000000013'],
    ['Breast', byName.Chicken, 70.0, 12, '2000000000014'],
    ['Wings', byName.Chicken, 55.0, 8, '2000000000015'],
    ['Chops', byName.Pork, 100.0, 10, '2000000000016'],
  ];

  // products.name has no unique constraint in schema.sql, so upsert manually
  // to keep this script safe to re-run.
  for (const [name, categoryId, pricePerKg, stockKg, barcode] of products) {
    const [existing] = await pool.query('SELECT id FROM products WHERE name = ?', [name]);
    if (existing[0]) {
      await pool.query(
        'UPDATE products SET category_id = ?, price_per_kg = ?, stock_kg = ?, barcode = ? WHERE id = ?',
        [categoryId, pricePerKg, stockKg, barcode, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO products (category_id, name, price_per_kg, stock_kg, barcode) VALUES (?, ?, ?, ?, ?)',
        [categoryId, name, pricePerKg, stockKg, barcode]
      );
    }
  }

  console.log('Seeded: admin/admin123, cashier/cashier123, 3 categories, 6 products (with barcodes).');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
