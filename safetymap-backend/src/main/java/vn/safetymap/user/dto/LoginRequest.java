package vn.safetymap.user.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Please enter email") String email,
        @NotBlank(message = "Please enter password") String password) {
}
