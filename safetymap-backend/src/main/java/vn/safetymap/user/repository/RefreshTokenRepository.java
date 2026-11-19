package vn.safetymap.user.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.safetymap.user.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    // Load the user immediately (with user roles set to EAGER) — this ensures that
    // a single call retrieves all the data needed to generate a JWT.
    @EntityGraph(attributePaths = "user")
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
                UPDATE RefreshToken t SET t.revokedAt = :now
                WHERE t.tokenHash = :hash AND t.revokedAt IS NULL AND t.expiresAt > :now
            """)
    int revokeIfActive(@Param("hash") String hash, @Param("now") Instant now);
}
