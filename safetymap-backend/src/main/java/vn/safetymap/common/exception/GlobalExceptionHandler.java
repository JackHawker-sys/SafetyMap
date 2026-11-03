package vn.safetymap.common.exception;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    private static final String SEPARATOR = "; ";

    // Business errors thrown by the service layer (NotFoundException, ConflictException, ...)
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiError.of(ex.getCode(), ex.getMessage()));
    }

    // @RequestParam / @PathVariable violating @Size, @Min, ... (e.g. 'q' of /streets)
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        String detail = ex.getParameterValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream()
                        .map(e -> Objects.requireNonNullElse(
                                        r.getMethodParameter().getParameterName(), "parameter")
                                + ": " + e.getDefaultMessage()))
                .collect(Collectors.joining(SEPARATOR));
        return ResponseEntity.badRequest()
                .body(ApiError.of(VALIDATION_FAILED, detail));
    }

    // Safety net: thrown instead of the above when a controller has @Validated
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
        String detail = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining(SEPARATOR));
        return ResponseEntity.badRequest()
                .body(ApiError.of(VALIDATION_FAILED, detail));
    }

    // Built-in Spring MVC errors (404 path, 405, 415, malformed JSON, ...)
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        HttpStatus resolved = HttpStatus.resolve(status.value());
        String reason = resolved != null ? resolved.getReasonPhrase() : "Unknown Error";
        return ResponseEntity.status(status).headers(headers)
                .body(ApiError.of("HTTP_" + status.value(), reason));
    }

    // Anything else is a bug: log it with an id the client can report back
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        String errorId = UUID.randomUUID().toString();
        log.error("Unexpected error [{}]", errorId, ex);
        return ResponseEntity.internalServerError()
                .body(ApiError.of("INTERNAL_ERROR",
                        "Internal server error. Error id: " + errorId));
    }
}