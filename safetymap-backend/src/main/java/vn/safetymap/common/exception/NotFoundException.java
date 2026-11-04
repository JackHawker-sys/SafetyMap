package vn.safetymap.common.exception;

import org.springframework.http.HttpStatus;

import java.util.Locale;
import java.util.regex.Pattern;

public class NotFoundException extends ApiException {
    private static final Pattern CAMEL_CASE = Pattern.compile("([a-z])([A-Z])");
    // regular expression to match camel case words, e.g., "myResource" ->
    // "MY_RESOURCE"

    public NotFoundException(String resource, Object id) {
        super(HttpStatus.NOT_FOUND,
                toCode(resource) + "_NOT_FOUND",
                resource + " " + id + " not found");
    }

    private static String toCode(String resource) {
        return CAMEL_CASE.matcher(resource)
                .replaceAll("$1_$2")
                .toUpperCase(Locale.ROOT);
    }
}
