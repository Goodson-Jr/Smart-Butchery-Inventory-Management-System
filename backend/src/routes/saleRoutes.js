const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/sales', requireAuth, async (req, res) => {
  const { product_id, quantity_kg } = req.body;

  if (!product_id || !(quantity_kg > 0)) {
    return res.status(400).json({ error: 'product_id and a positive quantity_kg are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [products] = await connection.query('SELECT price_per_kg FROM products WHERE id = ? FOR UPDATE', [
      product_id,
    ]);
    const product = products[0];
    if (!product) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalPrice = Number(product.price_per_kg) * Number(quantity_kg);

    const [updateResult] = await connection.query(
      'UPDATE products SET stock_kg = stock_kg - ? WHERE id = ? AND stock_kg >= ?',
      [quantity_kg, product_id, quantity_kg]
    );
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Not enough stock' });
    }

    const [insertResult] = await connection.query(
      'INSERT INTO sales (product_id, quantity_kg, unit_price, total_price, sold_by) VALUES (?, ?, ?, ?, ?)',
      [product_id, quantity_kg, product.price_per_kg, totalPrice, req.user.id]
    );

    await connection.commit();
    res.status(201).json({ id: insertResult.insertId, total_price: totalPrice });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

router.post('/sales/batch', requireAuth, async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array of { product_id, quantity_kg }' });
  }
  for (const item of items) {
    if (!item.product_id || !(item.quantity_kg > 0)) {
      return res.status(400).json({ error: 'each item needs a product_id and a positive quantity_kg' });
    }
  }

  // Lock rows in a consistent order (by product_id) across all requests to avoid deadlocks
  // between two concurrent checkouts that share products, then reassemble the response
  // in the cart's original order for the receipt.
  const ordered = items.map((item, index) => ({ ...item, _index: index }));
  ordered.sort((a, b) => a.product_id - b.product_id);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const lines = new Array(items.length);
    for (const { product_id, quantity_kg, _index } of ordered) {
      const [products] = await connection.query('SELECT name, price_per_kg FROM products WHERE id = ? FOR UPDATE', [
        product_id,
      ]);
      const product = products[0];
      if (!product) {
        await connection.rollback();
        return res.status(404).json({ error: 'Product not found', product_id });
      }

      const totalPrice = Number(product.price_per_kg) * Number(quantity_kg);

      const [updateResult] = await connection.query(
        'UPDATE products SET stock_kg = stock_kg - ? WHERE id = ? AND stock_kg >= ?',
        [quantity_kg, product_id, quantity_kg]
      );
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Not enough stock', product_id });
      }

      const [insertResult] = await connection.query(
        'INSERT INTO sales (product_id, quantity_kg, unit_price, total_price, sold_by) VALUES (?, ?, ?, ?, ?)',
        [product_id, quantity_kg, product.price_per_kg, totalPrice, req.user.id]
      );

      lines[_index] = {
        sale_id: insertResult.insertId,
        product_id,
        product_name: product.name,
        quantity_kg,
        unit_price: product.price_per_kg,
        total_price: totalPrice,
      };
    }

    await connection.commit();

    const grandTotal = lines.reduce((sum, line) => sum + Number(line.total_price), 0);
    res.status(201).json({ lines, grand_total: grandTotal, sold_at: new Date().toISOString() });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

router.get('/sales/today', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(quantity_kg), 0) AS total_kg_sold, COALESCE(SUM(total_price), 0) AS total_revenue
     FROM sales WHERE DATE(sold_at) = CURDATE()`
  );
  res.json(rows[0]);
});

module.exports = router;
