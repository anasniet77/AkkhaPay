package com.paywallet.app.controller;

import com.paywallet.app.dto.CreateOrderRequest;
import com.paywallet.app.dto.VerifyPaymentRequest;
import com.paywallet.app.service.PaymentGatewayService;
import com.paywallet.app.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Handles external payment gateway interactions (Razorpay).
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentGatewayService paymentGatewayService;
    private final WalletService walletService;

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Map<String, Object> orderDetails = paymentGatewayService.createOrder(request.getAmount());
        return ResponseEntity.ok(orderDetails);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        boolean isValid = paymentGatewayService.verifyPayment(
                request.getOrderId(),
                request.getPaymentId(),
                request.getSignature()
        );

        if (isValid) {
            walletService.addFunds(request.getUserId(), request.getAmount());
            return ResponseEntity.ok(Map.of("message", "Payment verified and funds added successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Payment signature verification failed"));
        }
    }
}

