package vn.safetymap.common.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@ConfigurationProperties(prefix = "safetymap")
public record SafetymapProperties(
                @Valid @NotNull Jwt jwt,
                @Valid @NotNull RefreshCookie refreshCookie,
                @Valid @NotNull Cors cors,
                @Valid @NotNull Recaptcha recaptcha) {
        public record Jwt(
                        @NotBlank String secret,
                        @NotNull Duration accessTokenTtl,
                        @NotNull Duration refreshTokenTtl) {
        }

        public record RefreshCookie(
                        @NotBlank String name,
                        @NotBlank String path,
                        boolean secure,
                        @NotBlank @Pattern(regexp = "Strict|Lax|None") String sameSite) {
        }

        public record Cors(@NotEmpty List<String> allowedOrigins) {
        }

        public record Recaptcha(@NotBlank String secret, @NotBlank String verifyUrl) {
        }
}
