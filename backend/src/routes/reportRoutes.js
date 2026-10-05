const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function resolveDateRange(req) {
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  const from = req.query.from || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

// Daily sales breakdown -- kg sold and revenue per day.
router.get('/reports/sales', requireAuth, async (req, res) => {
  const { from, to } = resolveDateRange(req);
  const [rows] = await pool.query(
    `SELECT DATE(sold_at) AS date, SUM(quantity_kg) AS kg_sold, SUM(total_price) AS revenue
     FROM sales
     WHERE DATE(sold_at) BETWEEN ? AND ?
     GROUP BY DATE(sold_at)
     ORDER BY date`,
    [from, to]
  );
  res.json({ from, to, days: rows });
});

// Estimated profit per day -- revenue minus cost, using products.cost_per_kg.
// Products with no cost_per_kg set contribute 0 cost for their lines, so the
// estimate is a floor, not exact -- missing_cost_products flags this.
router.get('/reports/profit', requireAuth, async (req, res) => {
  const { from, to } = resolveDateRange(req);

  const [rows] = await pool.query(
    `SELECT DATE(s.sold_at) AS date,
            SUM(s.total_price) AS revenue,
            SUM(s.quantity_kg * COALESCE(p.cost_per_kg, 0)) AS estimated_cost,
            SUM(s.total_price - s.quantity_kg * COALESCE(p.cost_per_kg, 0)) AS estimated_profit
     FROM sales s JOIN products p ON p.id = s.product_id
     WHERE DATE(s.sold_at) BETWEEN ? AND ?
     GROUP BY DATE(s.sold_at)
     ORDER BY date`,
    [from, to]
  );

  const [[{ missing_cost_products }]] = await pool.query(
    'SELECT COUNT(*) AS missing_cost_products FROM products WHERE is_active = TRUE AND cost_per_kg IS NULL'
  );

  res.json({ from, to, days: rows, missing_cost_products });
});

// Stock usage per product within the date range: received (deliveries),
// sold, and wasted, so management can see where stock is actually going.
router.get('/reports/stock-usage', requireAuth, async (req, res) => {
  const { from, to } = resolveDateRange(req);

  const [rows] = await pool.query(
    `SELECT p.id, p.name,
            COALESCE(sb.total_received, 0) AS total_received_kg,
            COALESCE(s.total_sold, 0) AS total_sold_kg,
            COALESCE(w.total_wasted, 0) AS total_wasted_kg
     FROM products p
     LEFT JOIN (
       SELECT product_id, SUM(quantity_kg) AS total_received FROM stock_batches
       WHERE DATE(received_at) BETWEEN ? AND ? GROUP BY product_id
     ) sb ON sb.product_id = p.id
     LEFT JOIN (
       SELECT product_id, SUM(quantity_kg) AS total_sold FROM sales
       WHERE DATE(sold_at) BETWEEN ? AND ? GROUP BY product_id
     ) s ON s.product_id = p.id
     LEFT JOIN (
       SELECT product_id, SUM(quantity_kg) AS total_wasted FROM wastage
       WHERE DATE(recorded_at) BETWEEN ? AND ? GROUP BY product_id
     ) w ON w.product_id = p.id
     WHERE p.is_active = TRUE
     ORDER BY p.name`,
    [from, to, from, to, from, to]
  );

  res.json({ from, to, products: rows });
});

module.exports = router;
