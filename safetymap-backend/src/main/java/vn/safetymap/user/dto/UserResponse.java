package vn.safetymap.user.dto;

import java.time.Instant;

public record UserResponse(
        Integer id,
        String email,
        String displayName,
        Boolean isActive,
        Instant createdAt) {
}
