package vn.safetymap.user.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.safetymap.user.dto.LoginRequest;
import vn.safetymap.user.dto.RegisterRequest;
import vn.safetymap.user.dto.TokenResponse;
import vn.safetymap.user.service.AuthResult;
import vn.safetymap.user.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final RefreshTokenCookies cookies;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest req) {
        return withSession(HttpStatus.CREATED, authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return withSession(HttpStatus.OK, authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(HttpServletRequest request) {
        return withSession(HttpStatus.OK, authService.refresh(cookies.read(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(cookies.read(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.clear().toString())
                .build();
    }

    // The body contains the access token + user; the new refresh token is sent via
    // the Set-Cookie header
    private ResponseEntity<TokenResponse> withSession(HttpStatus status, AuthResult result) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookies.create(result.refreshToken()).toString())
                .cacheControl(CacheControl.noStore()) // prevent the browser/proxy from caching the token
                .body(result.body());
    }
}
