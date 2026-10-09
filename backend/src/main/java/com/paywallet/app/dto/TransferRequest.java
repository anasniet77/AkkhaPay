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
 * Request DTO for wallet-to-wallet fund transfers with required 4-digit PIN authentication.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferRequest {

    @NotNull(message = "Sender user ID is required")
    private Long senderUserId;

    @NotNull(message = "Receiver user ID is required")
    private Long receiverUserId;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "0.01", message = "Transfer amount must be at least 0.01")
    private BigDecimal amount;

    @NotBlank(message = "Transaction PIN is required")
    @Pattern(regexp = "^\\d{4}$", message = "Transaction PIN must be 4 numeric digits")
    private String pin;
}
