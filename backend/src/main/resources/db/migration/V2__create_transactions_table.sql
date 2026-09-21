-- =====================================================================
-- V2__create_transactions_table.sql
-- PayWallet — transactions table for wallet transfers, deposits, withdrawals
-- =====================================================================

CREATE TABLE transactions (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    sender_wallet_id   BIGINT        NULL,
    receiver_wallet_id BIGINT        NULL,
    amount             DECIMAL(19,4) NOT NULL,
    transaction_type   VARCHAR(20)   NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    reference_number   VARCHAR(50)   NOT NULL,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT uq_transactions_ref UNIQUE (reference_number),
    CONSTRAINT fk_transactions_sender   FOREIGN KEY (sender_wallet_id)   REFERENCES wallets (id),
    CONSTRAINT fk_transactions_receiver FOREIGN KEY (receiver_wallet_id) REFERENCES wallets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

