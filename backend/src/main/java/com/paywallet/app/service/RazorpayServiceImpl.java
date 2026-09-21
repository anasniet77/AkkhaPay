package com.paywallet.app.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Razorpay implementation of {@link PaymentGatewayService}.
 * <p>
 * Converts amounts to paise (× 100) before sending to Razorpay,
 * since their API works in the smallest currency unit.
 */
@Service
public class RazorpayServiceImpl implements PaymentGatewayService {

    private final String keyId;
    private final String keySecret;

    public RazorpayServiceImpl(
            @Value("${razorpay.key.id}") String keyId,
            @Value("${razorpay.key.secret}") String keySecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    @Override
    public Map<String, Object> createOrder(BigDecimal amount) {
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject options = new JSONObject();
            // Razorpay expects amount in paise (smallest currency unit)
            options.put("amount", amount.multiply(new BigDecimal("100")).intValue());
            options.put("currency", "INR");
            options.put("receipt", "rcpt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));

            Order order = client.orders.create(options);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", amount);
            response.put("currency", "INR");
            response.put("keyId", keyId);
            return response;

        } catch (Exception e) {
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (Exception e) {
            return false;
        }
    }
}

