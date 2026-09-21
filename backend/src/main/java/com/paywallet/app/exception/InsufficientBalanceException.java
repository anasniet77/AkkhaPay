package com.paywallet.app.exception;

import java.math.BigDecimal;

/**
 * Thrown when a wallet does not have enough balance to complete a transaction.
 */
public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(String message) {
        super(message);
    }

    public InsufficientBalanceException(BigDecimal available, BigDecimal requested) {
        super(String.format(
                "Insufficient balance: available %s, requested %s",
                available.toPlainString(),
                requested.toPlainString()
        ));
    }
}

