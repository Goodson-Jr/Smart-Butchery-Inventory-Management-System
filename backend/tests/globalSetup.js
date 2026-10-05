// Runs once before the whole test suite. Creates a dedicated sbims_test
// database (separate from dev/prod), applies schema.sql + all migrations,
// then seeds the fixed set of users/categories/products every test file
// relies on. Never touches sbims (dev) or the production database.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// globalSetup runs in its own process, separate from each test file's
// environment -- Jest's setupFiles (tests/setup-env.js) never run here, so
// this has to load the developer's real .env itself to get DB credentials.
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

module.exports = async function globalSetup() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const admin = await mysql.createConnection({ host, port, user, password, multipleStatements: true });

  await admin.query('DROP DATABASE IF EXISTS sbims_test');
  await admin.query('CREATE DATABASE sbims_test');
  await admin.query('USE sbims_test');

  // schema.sql is the fresh-install source of truth and already includes
  // every column the migrations add -- the migrations/*.sql files are only
  // for upgrading a database that predates them (e.g. production before
  // PRs #38/#47/#43 landed). Applying both here would fail on duplicate
  // columns, so a fresh test database only ever needs schema.sql.
  const schemaDir = path.join(__dirname, '..', 'database');
  const schemaSql = fs.readFileSync(path.join(schemaDir, 'schema.sql'), 'utf8')
    .replace(/CREATE DATABASE IF NOT EXISTS sbims;/i, '')
    .replace(/USE sbims;/i, '');
  await admin.query(schemaSql);

  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);
  await admin.query(
    "INSERT INTO users (username, password_hash, role) VALUES ('admin', ?, 'admin'), ('cashier', ?, 'cashier')",
    [adminHash, cashierHash]
  );

  // Deliberately no products here. Stock-mutating tests (sales, stock-in,
  // wastage) each create their own product through the real API instead of
  // sharing seeded rows -- otherwise two test files touching the same
  // product's stock_kg could make each other flaky for reasons that have
  // nothing to do with the code under test, even running one file at a time.
  await admin.query("INSERT INTO categories (name) VALUES ('Beef'), ('Chicken'), ('Pork')");

  await admin.end();
};
