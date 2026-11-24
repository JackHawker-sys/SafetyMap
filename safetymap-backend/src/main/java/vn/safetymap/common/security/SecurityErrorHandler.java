package vn.safetymap.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import vn.safetymap.common.exception.ApiError;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

// An authorization error occurs within a filter, BEFORE reaching the controller,
// so GlobalExceptionHandler fails to catch it -> the JSON must be written manually here
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {
    private final JsonMapper jsonMapper; // Jackson 3 (Spring Boot 4)

    public SecurityErrorHandler(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    // Not logged in, or token is incorrect/expired
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException ex) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED,
                ApiError.of("UNAUTHORIZED", "Please log in to continue"));
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException ex) throws IOException {
        write(response, HttpStatus.FORBIDDEN,
                ApiError.of("FORBIDDEN", "You do not have permission to perform this action"));
    }

    private void write(HttpServletResponse response, HttpStatus status, ApiError body) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        jsonMapper.writeValue(response.getOutputStream(), body);
    }
}
