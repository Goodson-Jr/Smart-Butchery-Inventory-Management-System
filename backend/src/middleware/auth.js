const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Re-read the user on every request so a deactivation or role change takes
  // effect straight away, not when their 12h token runs out (#40).
  const [rows] = await pool.query('SELECT id, username, role, is_active FROM users WHERE id = ?', [payload.id]);
  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'This account has been deactivated' });
  }

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Only ${role} accounts can do this` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
