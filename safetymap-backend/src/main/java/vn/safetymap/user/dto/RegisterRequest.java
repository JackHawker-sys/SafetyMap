package vn.safetymap.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Please enter your full name") @Size(max = 100, message = "Full name is maximum at 100 characters") String displayName,

        @NotBlank(message = "Please enter your email") @Email(message = "Email is invalid") @Size(max = 256, message = "Email is too long") String email,

        @NotBlank(message = "Please enter your password") @Size(min = 6, message = "Minimum password length is 6 characters") String password,

        @NotBlank(message = "Please confirm that you are not a robot") String captchaToken) {
}
