const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/stock-batches', requireAuth, async (req, res) => {
  const { product_id, quantity_kg } = req.body;

  if (!product_id || !(quantity_kg > 0)) {
    return res.status(400).json({ error: 'product_id and a positive quantity_kg are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [products] = await connection.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (!products[0]) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    await connection.query(
      'INSERT INTO stock_batches (product_id, quantity_kg, received_by) VALUES (?, ?, ?)',
      [product_id, quantity_kg, req.user.id]
    );
    await connection.query('UPDATE products SET stock_kg = stock_kg + ? WHERE id = ?', [quantity_kg, product_id]);

    await connection.commit();
    res.status(201).end();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

module.exports = router;
