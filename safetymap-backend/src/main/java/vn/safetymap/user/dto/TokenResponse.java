package vn.safetymap.user.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user) {
}
