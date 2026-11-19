package vn.safetymap.user.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.safetymap.common.config.SafetymapProperties;
import vn.safetymap.user.entity.RefreshToken;
import vn.safetymap.user.entity.User;
import vn.safetymap.user.repository.RefreshTokenRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service

public class RefreshTokenService {
    private static final int TOKEN_BYTE = 32;

    private final SecureRandom secureRandom = new SecureRandom();
    private final RefreshTokenRepository repository;
    private final Duration refreshTokenTtl;

    public RefreshTokenService(RefreshTokenRepository repository, SafetymapProperties properties) {
        this.repository = repository;
        this.refreshTokenTtl = properties.jwt().refreshTokenTtl();
    }

    public Duration ttl() {
        return refreshTokenTtl;
    }

    // Generate a new token for the user. Return the ACTUAL token to be placed in a
    // cookie; the database stores only the SHA-256 hash.
    @Transactional
    public String issue(User user) {
        byte[] bytes = new byte[TOKEN_BYTE];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(Instant.now().plus(refreshTokenTtl));
        repository.save(token);

        return rawToken;
    }

    // Used for /refresh: revokes the old token and returns its owner, in order to
    // issue a new token (token rotation).
    // Token is invalid, expired, or revoked -> Optional.empty() -> 401
    @Transactional
    public Optional<User> consume(String rawToken) {
        String hash = hash(rawToken);
        if (repository.revokeIfActive(hash, Instant.now()) == 0) {
            return Optional.empty();
        }
        return repository.findByTokenHash(hash).map(RefreshToken::getUser);
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.revokeIfActive(hash(rawToken), Instant.now());
    }

    public static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
