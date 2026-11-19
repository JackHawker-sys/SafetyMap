package vn.safetymap.common.security;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import vn.safetymap.common.config.SafetymapProperties;
import vn.safetymap.user.entity.User;
import vn.safetymap.user.entity.UserRole;

@Service
public class JwtService {
    private static final String ROLES_CLAIM = "roles";

    private final SecretKey key;
    private final Duration accessTokenTtl;

    public JwtService(SafetymapProperties properties) {
        // If the secret is invalid (base64-encoded incorrectly or shorter than 32
        // bytes) -> an error occurs at startup (WeakKeyException)
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.jwt().secret()));
        this.accessTokenTtl = properties.jwt().accessTokenTtl();
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        List<String> roles = user.getRoles().stream().map(Enum::name).sorted().toList();

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(ROLES_CLAIM, roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .signWith(key, Jwts.SIG.HS256) // explicitly specify HS256; do not let jjwt choose based on the key
                                               // length
                .compact();
    }

    // "expiresIn" value returned to the frontend
    public long accessTokenTtlSeconds() {
        return accessTokenTtl.toSeconds();
    }

    // Token is invalid, has an incorrect signature, or is expired -> returns
    // Optional.empty(); the filter treats this as "not logged in."
    public Optional<AuthUser> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Integer userId = Integer.valueOf(claims.getSubject());
            return Optional.of(new AuthUser(userId, readRoles(claims)));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private Set<UserRole> readRoles(Claims claims) {
        Set<UserRole> roles = EnumSet.noneOf(UserRole.class);
        Object raw = claims.get(ROLES_CLAIM);
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                try {
                    roles.add(UserRole.valueOf(String.valueOf(item)));
                } catch (IllegalArgumentException ignored) {
                    // not a USER / MODERATOR / ADMIN
                }
            }
        }
        return roles;
    }
}
