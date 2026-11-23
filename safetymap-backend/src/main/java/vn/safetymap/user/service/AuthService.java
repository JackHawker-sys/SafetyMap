package vn.safetymap.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.safetymap.common.exception.ConflictException;
import vn.safetymap.common.exception.ForbiddenException;
import vn.safetymap.common.exception.UnauthorizedException;
import vn.safetymap.common.security.JwtService;
import vn.safetymap.common.security.RecaptchaVerifier;
import vn.safetymap.user.dto.LoginRequest;
import vn.safetymap.user.dto.RegisterRequest;
import vn.safetymap.user.dto.TokenResponse;
import vn.safetymap.user.dto.UserResponse;
import vn.safetymap.user.entity.User;
import vn.safetymap.user.entity.UserRole;
import vn.safetymap.user.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {
    public static final int BCRYPT_MAX_BYTES = 75;

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RecaptchaVerifier recaptchaVerifier;

    // Dummy hash: BCrypt is executed even if the email does not exist, ensuring
    // consistent response times so that an external observer cannot determine which
    // emails are registered by measuring the time taken.
    private final String dummyHash;

    public AuthService(UserRepository userRepository, RefreshTokenService refreshTokenService,
            JwtService jwtService, PasswordEncoder passwordEncoder,
            RecaptchaVerifier recaptchaVerifier) {
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode("safetymap-dummy-password");
        this.recaptchaVerifier = recaptchaVerifier;
    }

    @Transactional
    public AuthResult register(RegisterRequest req) {
        recaptchaVerifier.verify(req.captchaToken());
        String email = normalizeEmail(req.email());
        if (req.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw new ConflictException("PASSWORD_TOO_LONG", "Password is too long");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_TAKEN", "This email has already been registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName().trim());
        user.getRoles().add(UserRole.USER);
        userRepository.save(user);

        return createSession(user);
    }

    @Transactional
    public AuthResult login(LoginRequest req) {
        recaptchaVerifier.verify(req.captchaToken());

        Optional<User> found = userRepository.findByEmail(normalizeEmail(req.email()));

        String hash = found.map(User::getPasswordHash).orElse(dummyHash);
        boolean passwordMatches = passwordEncoder.matches(req.password(), hash);

        if (found.isEmpty() || !passwordMatches) {
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Incorrect email or password");
        }

        User user = found.get();

        // Account is announced to be "locked" once the correct password has been
        // entered (When account is locked)
        if (!user.getIsActive()) {
            throw new ForbiddenException("ACOUNT_LOCKED", "Your account has been locked");
        }
        return createSession(user);
    }

    // Rotation: revoke the old refresh token and issue a new pair of tokens
    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw sessionExpired();
        }
        User user = refreshTokenService.consume(rawRefreshToken).orElseThrow(AuthService::sessionExpired);

        // Locked after login -> subsequent refresh attempt is blocked (up to 1 hour
        // after the lock occurs)
        if (!user.getIsActive()) {
            throw new ForbiddenException("ACOUNT_LOCKED", "Your account has been locked");
        }
        return createSession(user);
    }

    // Log out only the current device; no cookies involved, and no errors reported
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    private AuthResult createSession(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.issue(user);

        TokenResponse body = new TokenResponse(
                accessToken, "Bearer", jwtService.accessTokenTtlSeconds(), toResponse(user));
        return new AuthResult(body, refreshToken);
    }

    private static UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.getIsActive(), u.getCreatedAt());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static UnauthorizedException sessionExpired() {
        return new UnauthorizedException("SESSION_EXPIRED", "Your login session has expired, please log in again.");
    }
}
