-- User management (#40): accounts are deactivated, never deleted. Run once:
--   mysql -u root -p sbims < database/migrations/003_user_is_active.sql
USE sbims;

ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role;
