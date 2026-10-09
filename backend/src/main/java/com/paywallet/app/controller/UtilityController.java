package com.paywallet.app.controller;

import com.paywallet.app.dto.BillPaymentRequest;
import com.paywallet.app.dto.RazorpayTransferRequest;
import com.paywallet.app.dto.RechargeRequest;
import com.paywallet.app.service.UtilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller for mobile recharges, bill payments, and Razorpay-powered transfers.
 */
@RestController
@RequestMapping("/api/v1/utilities")
@RequiredArgsConstructor
public class UtilityController {

    private final UtilityService utilityService;

    @PostMapping("/recharge")
    public ResponseEntity<Map<String, Object>> rechargeMobile(@Valid @RequestBody RechargeRequest request) {
        Map<String, Object> response = utilityService.processMobileRecharge(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bill-payment")
    public ResponseEntity<Map<String, Object>> payBill(@Valid @RequestBody BillPaymentRequest request) {
        Map<String, Object> response = utilityService.processBillPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transfer-razorpay")
    public ResponseEntity<Map<String, Object>> transferRazorpay(@Valid @RequestBody RazorpayTransferRequest request) {
        Map<String, Object> response = utilityService.processRazorpayTransfer(request);
        return ResponseEntity.ok(response);
    }
}
