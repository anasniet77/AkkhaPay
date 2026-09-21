package com.paywallet.app.service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Abstraction over a payment gateway (Razorpay, Stripe, etc.).
 * <p>
 * Implementations can be swapped without changing consumers.
 */
public interface PaymentGatewayService {

    /**
     * Creates a payment order for the given amount.
     *
     * @param amount the amount in the primary currency unit (e.g. INR)
     * @return a map containing at least: orderId, amount, currency, keyId
     */
    Map<String, Object> createOrder(BigDecimal amount);

    /**
     * Verifies a payment callback signature.
     *
     * @param orderId   the gateway order ID
     * @param paymentId the gateway payment ID
     * @param signature the callback signature
     * @return true if the signature is valid
     */
    boolean verifyPayment(String orderId, String paymentId, String signature);
}

