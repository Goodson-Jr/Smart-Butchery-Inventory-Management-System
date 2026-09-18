const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/products', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.price_per_kg, p.stock_kg, p.low_stock_threshold_kg
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = TRUE
     ORDER BY p.name`
  );
  res.json(rows);
});

router.post('/products', requireAuth, requireRole('admin'), async (req, res) => {
  const { category_id, name, price_per_kg, low_stock_threshold_kg } = req.body;

  if (!category_id || !name || !(price_per_kg > 0)) {
    return res.status(400).json({ error: 'category_id, name, and a positive price_per_kg are required' });
  }
  if (low_stock_threshold_kg !== undefined && !(low_stock_threshold_kg >= 0)) {
    return res.status(400).json({ error: 'low_stock_threshold_kg cannot be negative' });
  }

  const [categories] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
  if (!categories[0]) {
    return res.status(400).json({ error: 'category_id does not exist' });
  }

  const [result] = await pool.query(
    'INSERT INTO products (category_id, name, price_per_kg, low_stock_threshold_kg) VALUES (?, ?, ?, COALESCE(?, 5))',
    [category_id, name, price_per_kg, low_stock_threshold_kg]
  );
  res.status(201).json({ id: result.insertId });
});

router.put('/products/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, price_per_kg, category_id, low_stock_threshold_kg } = req.body;

  if (price_per_kg !== undefined && !(price_per_kg > 0)) {
    return res.status(400).json({ error: 'price_per_kg must be positive' });
  }
  if (low_stock_threshold_kg !== undefined && !(low_stock_threshold_kg >= 0)) {
    return res.status(400).json({ error: 'low_stock_threshold_kg cannot be negative' });
  }
  if (category_id !== undefined) {
    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!categories[0]) {
      return res.status(400).json({ error: 'category_id does not exist' });
    }
  }

  const [result] = await pool.query(
    `UPDATE products SET
      name = COALESCE(?, name),
      price_per_kg = COALESCE(?, price_per_kg),
      category_id = COALESCE(?, category_id),
      low_stock_threshold_kg = COALESCE(?, low_stock_threshold_kg)
     WHERE id = ?`,
    [name, price_per_kg, category_id, low_stock_threshold_kg, req.params.id]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.status(204).end();
});

router.get('/categories', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY name');
  res.json(rows);
});

router.post('/categories', requireAuth, requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    throw err;
  }
});

router.get('/alerts/low-stock', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, stock_kg, low_stock_threshold_kg FROM products WHERE is_active = TRUE AND stock_kg <= low_stock_threshold_kg ORDER BY stock_kg'
  );
  res.json(rows);
});

module.exports = router;
