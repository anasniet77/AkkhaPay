package com.paywallet.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for changing an existing 4-digit transaction PIN.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinUpdateRequest {

    @NotBlank(message = "Current PIN is required")
    @Pattern(regexp = "^\\d{4}$", message = "Current PIN must be exactly 4 numeric digits")
    private String currentPin;

    @NotBlank(message = "New PIN is required")
    @Pattern(regexp = "^\\d{4}$", message = "New PIN must be exactly 4 numeric digits")
    private String newPin;
}
