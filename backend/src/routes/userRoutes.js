const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const ROLES = ['admin', 'cashier'];
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,50}$/;
const MIN_PASSWORD_LENGTH = 6;

// Every route here is manager-only (#40, FR25).
router.use('/users', requireAuth, requireRole('admin'));

function passwordError(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

router.get('/users', async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, role, is_active, created_at FROM users ORDER BY username');
  res.json(rows);
});

router.post('/users', async (req, res) => {
  const { username, password, role } = req.body;

  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return res.status(400).json({ error: 'username must be 3-50 letters, numbers, dots, dashes or underscores' });
  }
  const badPassword = passwordError(password);
  if (badPassword) {
    return res.status(400).json({ error: badPassword });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [
      username,
      passwordHash,
      role,
    ]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That username is already taken' });
    }
    throw err;
  }
});

// Change role and/or deactivate/reactivate. Accounts are never deleted, so
// their sales and stock history stays attached to a real user.
router.put('/users/:id', async (req, res) => {
  const { role, is_active } = req.body;
  const targetId = Number(req.params.id);

  if (role !== undefined && !ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
  }
  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be true or false' });
  }
  if (role === undefined && is_active === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const removesAdmin = (role !== undefined && role !== 'admin') || is_active === false;
  if (removesAdmin && targetId === req.user.id) {
    return res.status(400).json({ error: "You can't demote or deactivate your own account" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT id, role, is_active FROM users WHERE id = ? FOR UPDATE', [targetId]);
    const target = rows[0];
    if (!target) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // Never leave the shop without an active manager who can get back in.
    if (removesAdmin && target.role === 'admin' && target.is_active) {
      const [admins] = await connection.query(
        "SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE FOR UPDATE"
      );
      if (admins.length <= 1) {
        await connection.rollback();
        return res.status(409).json({ error: 'This is the last active admin account' });
      }
    }

    await connection.query('UPDATE users SET role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?', [
      role ?? null,
      is_active ?? null,
      targetId,
    ]);

    await connection.commit();
    res.json({ id: targetId });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

router.post('/users/:id/password', async (req, res) => {
  const { password } = req.body;
  const badPassword = passwordError(password);
  if (badPassword) {
    return res.status(400).json({ error: badPassword });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.params.id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ id: Number(req.params.id) });
});

module.exports = router;
