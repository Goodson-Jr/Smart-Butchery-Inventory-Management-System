const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/wastage', requireAuth, async (req, res) => {
  const { product_id, quantity_kg, reason } = req.body;

  if (!product_id || !(quantity_kg > 0)) {
    return res.status(400).json({ error: 'product_id and a positive quantity_kg are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query(
      'UPDATE products SET stock_kg = stock_kg - ? WHERE id = ? AND stock_kg >= ?',
      [quantity_kg, product_id, quantity_kg]
    );
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Not enough stock to write off' });
    }

    const [insertResult] = await connection.query(
      'INSERT INTO wastage (product_id, quantity_kg, reason, recorded_by) VALUES (?, ?, ?, ?)',
      [product_id, quantity_kg, reason || null, req.user.id]
    );

    await connection.commit();
    res.status(201).json({ id: insertResult.insertId });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

router.get('/wastage', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.id, w.product_id, p.name AS product_name, w.quantity_kg, w.reason, w.recorded_at
     FROM wastage w JOIN products p ON p.id = w.product_id
     ORDER BY w.recorded_at DESC LIMIT 100`
  );
  res.json(rows);
});

module.exports = router;
