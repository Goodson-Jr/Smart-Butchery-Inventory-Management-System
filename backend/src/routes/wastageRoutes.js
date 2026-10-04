const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const REASONS = ['SPOILAGE', 'EXPIRY', 'TRIM', 'OTHER'];
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

// Takes the wasted weight off a product's stock inside an open transaction.
// Returns false (and changes nothing) if there isn't enough stock left.
async function deductStock(connection, productId, quantityKg) {
  const [result] = await connection.query(
    'UPDATE products SET stock_kg = stock_kg - ? WHERE id = ? AND stock_kg >= ?',
    [quantityKg, productId, quantityKg]
  );
  return result.affectedRows > 0;
}

// Cashiers report wastage as PENDING -- stock only moves once a manager
// approves it (#39). An admin's own report is approved straight away.
router.post('/wastage', requireAuth, async (req, res) => {
  const { product_id, quantity_kg, reason, note } = req.body;

  if (!product_id || !(quantity_kg > 0)) {
    return res.status(400).json({ error: 'product_id and a positive quantity_kg are required' });
  }
  if (!REASONS.includes(reason)) {
    return res.status(400).json({ error: `reason must be one of ${REASONS.join(', ')}` });
  }

  const [products] = await pool.query('SELECT stock_kg FROM products WHERE id = ? AND is_active = TRUE', [
    product_id,
  ]);
  if (!products[0]) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (Number(quantity_kg) > Number(products[0].stock_kg)) {
    return res.status(409).json({ error: 'Not enough stock to write off' });
  }

  const isAdmin = req.user.role === 'admin';
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (isAdmin && !(await deductStock(connection, product_id, quantity_kg))) {
      await connection.rollback();
      return res.status(409).json({ error: 'Not enough stock to write off' });
    }

    const [insertResult] = await connection.query(
      `INSERT INTO wastage (product_id, quantity_kg, reason, note, status, recorded_by, reviewed_by, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        quantity_kg,
        reason,
        note || null,
        isAdmin ? 'APPROVED' : 'PENDING',
        req.user.id,
        isAdmin ? req.user.id : null,
        isAdmin ? new Date() : null,
      ]
    );

    await connection.commit();
    res.status(201).json({ id: insertResult.insertId, status: isAdmin ? 'APPROVED' : 'PENDING' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// Admins see everyone's reports; cashiers only see their own. ?status=PENDING
// etc. narrows it down.
router.get('/wastage', requireAuth, async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  }

  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('w.status = ?');
    params.push(status);
  }
  if (req.user.role !== 'admin') {
    conditions.push('w.recorded_by = ?');
    params.push(req.user.id);
  }

  const [rows] = await pool.query(
    `SELECT w.id, w.product_id, p.name AS product_name, p.stock_kg, w.quantity_kg, w.reason, w.note, w.status,
            w.recorded_at, ru.username AS recorded_by_username,
            w.reviewed_at, vu.username AS reviewed_by_username, w.rejection_reason
     FROM wastage w
     JOIN products p ON p.id = w.product_id
     JOIN users ru ON ru.id = w.recorded_by
     LEFT JOIN users vu ON vu.id = w.reviewed_by
     ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
     ORDER BY w.recorded_at DESC LIMIT 100`,
    params
  );
  res.json(rows);
});

router.post('/wastage/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT product_id, quantity_kg, status FROM wastage WHERE id = ? FOR UPDATE', [
      req.params.id,
    ]);
    const wastage = rows[0];
    if (!wastage) {
      await connection.rollback();
      return res.status(404).json({ error: 'Wastage report not found' });
    }
    if (wastage.status !== 'PENDING') {
      await connection.rollback();
      return res.status(409).json({ error: `This report was already ${wastage.status.toLowerCase()}` });
    }

    // Stock is re-checked now, not when it was reported -- some of it may
    // have been sold in between.
    if (!(await deductStock(connection, wastage.product_id, wastage.quantity_kg))) {
      await connection.rollback();
      return res.status(409).json({ error: 'Not enough stock left to write this off -- reject it instead' });
    }

    await connection.query(
      "UPDATE wastage SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [req.user.id, req.params.id]
    );

    await connection.commit();
    res.json({ id: Number(req.params.id), status: 'APPROVED' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

router.post('/wastage/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
  const { rejection_reason } = req.body;

  const [result] = await pool.query(
    "UPDATE wastage SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ? AND status = 'PENDING'",
    [req.user.id, rejection_reason || null, req.params.id]
  );
  if (result.affectedRows === 0) {
    const [rows] = await pool.query('SELECT status FROM wastage WHERE id = ?', [req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Wastage report not found' });
    }
    return res.status(409).json({ error: `This report was already ${rows[0].status.toLowerCase()}` });
  }

  res.json({ id: Number(req.params.id), status: 'REJECTED' });
});

module.exports = router;
