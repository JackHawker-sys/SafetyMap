package vn.safetymap.user.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;
import vn.safetymap.common.config.SafetymapProperties;

import java.time.Duration;

@Component
public class RefreshTokenCookies {
    private final SafetymapProperties.RefreshCookie config;
    private final Duration maxAge;

    public RefreshTokenCookies(SafetymapProperties properties) {
        this.config = properties.refreshCookie();
        this.maxAge = properties.jwt().refreshTokenTtl();
    }

    public ResponseCookie create(String rawToken) {
        return base(rawToken).maxAge(maxAge).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    public String read(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, config.name());
        return cookie == null ? null : cookie.getValue();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(config.name(), value)
                .httpOnly(true) // JavaScript cannot be read
                .secure(config.secure())
                .sameSite(config.sameSite()) // Strict: other websites do not include this cookie
                .path(config.path()); // sent only when calling /api/auth/*
    }
}
