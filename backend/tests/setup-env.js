// Runs before each test file's modules are loaded. Loads the developer's
// real .env first (so DB_HOST/USER/PASSWORD match their actual local MySQL
// setup), then overrides only DB_NAME -- so tests run against an isolated
// sbims_test database on that same server, never dev or production data.
require('dotenv').config({ quiet: true });

process.env.DB_NAME = 'sbims_test';
process.env.JWT_SECRET = 'test_secret_do_not_use_in_production';
process.env.BUSINESS_TIMEZONE = '+02:00';
