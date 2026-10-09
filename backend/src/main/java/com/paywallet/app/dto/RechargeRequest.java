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
 * Request payload for mobile recharge.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RechargeRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please enter a valid 10-digit mobile number")
    private String mobileNumber;

    @NotBlank(message = "Operator is required")
    private String operator;

    @NotBlank(message = "Circle is required")
    private String circle;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "10.00", message = "Minimum recharge amount is ₹10.00")
    private BigDecimal amount;

    private String planDetails;

    @NotBlank(message = "4-digit security PIN is required")
    @Pattern(regexp = "^\\d{4}$", message = "PIN must be exactly 4 digits")
    private String pin;
}
