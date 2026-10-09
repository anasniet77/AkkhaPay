package com.paywallet.app.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request payload for utility bill payment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillPaymentRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Category is required")
    private String category; // Electricity, Water, Gas, Broadband, DTH, FASTag

    @NotBlank(message = "Biller name is required")
    private String billerName;

    @NotBlank(message = "Consumer account number is required")
    private String consumerNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum bill amount is ₹1.00")
    private BigDecimal amount;

    @NotBlank(message = "4-digit security PIN is required")
    @Pattern(regexp = "^\\d{4}$", message = "PIN must be exactly 4 digits")
    private String pin;
}
