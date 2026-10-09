package com.paywallet.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for initial 4-digit transaction PIN setup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinSetupRequest {

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^\\d{4}$", message = "PIN must be exactly 4 numeric digits")
    private String pin;
}
