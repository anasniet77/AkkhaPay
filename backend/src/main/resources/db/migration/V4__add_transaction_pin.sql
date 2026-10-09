-- =====================================================================
-- V4__add_transaction_pin.sql
-- PayWallet — add transaction PIN hash column to users table
-- =====================================================================

ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255) NULL;
