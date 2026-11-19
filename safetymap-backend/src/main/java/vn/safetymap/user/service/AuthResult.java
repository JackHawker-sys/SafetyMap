package vn.safetymap.user.service;

import vn.safetymap.user.dto.TokenResponse;

// The body returns JSON; the refreshToken is placed into an HttpOnly cookie by the controller
public record AuthResult(TokenResponse body, String refreshToken) {
}
