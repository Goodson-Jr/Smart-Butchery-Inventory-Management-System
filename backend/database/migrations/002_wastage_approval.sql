-- Wastage report -> manager approval (#39). Run once on an existing database:
--   mysql -u root -p sbims < database/migrations/002_wastage_approval.sql
USE sbims;

ALTER TABLE wastage
  ADD COLUMN note VARCHAR(255) NULL AFTER reason,
  ADD COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' AFTER note,
  ADD COLUMN reviewed_by INT NULL AFTER recorded_at,
  ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by,
  ADD COLUMN rejection_reason VARCHAR(255) NULL AFTER reviewed_at,
  ADD FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- Old rows already took stock off when they were recorded, so they count as
-- approved. Their free-text reason moves into note.
UPDATE wastage
SET note = reason, reason = 'OTHER', status = 'APPROVED',
    reviewed_by = recorded_by, reviewed_at = recorded_at;

ALTER TABLE wastage
  MODIFY reason ENUM('SPOILAGE', 'EXPIRY', 'TRIM', 'OTHER') NOT NULL DEFAULT 'OTHER';
