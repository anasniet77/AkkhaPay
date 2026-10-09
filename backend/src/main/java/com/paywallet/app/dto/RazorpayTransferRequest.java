package com.paywallet.app.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request payload for transferring funds to a recipient via Razorpay checkout interface.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayTransferRequest {

    @NotNull(message = "Sender User ID is required")
    private Long senderUserId;

    @NotNull(message = "Receiver User ID is required")
    private Long receiverUserId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is ₹1.00")
    private BigDecimal amount;

    @NotBlank(message = "Razorpay Order ID is required")
    private String orderId;

    @NotBlank(message = "Razorpay Payment ID is required")
    private String paymentId;

    @NotBlank(message = "Razorpay Signature is required")
    private String signature;
}
