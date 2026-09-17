const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/products', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, category_id, name, price_per_kg, stock_kg, low_stock_threshold_kg FROM products WHERE is_active = TRUE ORDER BY name'
  );
  res.json(rows);
});

router.get('/categories', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY name');
  res.json(rows);
});

router.get('/alerts/low-stock', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, stock_kg, low_stock_threshold_kg FROM products WHERE is_active = TRUE AND stock_kg <= low_stock_threshold_kg ORDER BY stock_kg'
  );
  res.json(rows);
});

module.exports = router;
