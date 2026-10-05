const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

// The shop's local time as a fixed UTC offset. Zambia is +02:00 all year (no
// daylight saving). Every connection uses it, so DATE(), CURDATE() and NOW()
// follow the shop's day rather than the host's UTC clock (#45).
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || '+02:00';

if (!/^[+-]\d{2}:\d{2}$/.test(BUSINESS_TIMEZONE)) {
  throw new Error(`BUSINESS_TIMEZONE must look like +02:00, got "${BUSINESS_TIMEZONE}"`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // So mysql2 reads and writes JS Dates in the same zone as the session.
  timezone: BUSINESS_TIMEZONE,
  // Calendar dates (e.g. DATE(sold_at) in reports) come back as plain
  // "2026-10-05" rather than a midnight timestamp that shifts by time zone.
  dateStrings: ['DATE'],
});

pool.pool.on('connection', (connection) => {
  connection.query('SET time_zone = ?', [BUSINESS_TIMEZONE]);
});

// The shop's calendar date, daysAgo days back, as YYYY-MM-DD.
function businessDate(daysAgo = 0) {
  const [, sign, hours, minutes] = BUSINESS_TIMEZONE.match(/^([+-])(\d{2}):(\d{2})$/);
  const offsetMs = (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes)) * 60 * 1000;
  return new Date(Date.now() + offsetMs - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

module.exports = pool;
module.exports.businessDate = businessDate;
module.exports.BUSINESS_TIMEZONE = BUSINESS_TIMEZONE;
