-- =====================================================================
-- V3__seed_roles.sql
-- PayWallet — seed default roles (idempotent)
-- =====================================================================

INSERT IGNORE INTO roles (name) VALUES ('USER');
INSERT IGNORE INTO roles (name) VALUES ('ADMIN');

