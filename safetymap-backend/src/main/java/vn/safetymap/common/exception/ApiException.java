package vn.safetymap.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;


@Getter
public abstract class ApiException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    protected ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }
    
}
