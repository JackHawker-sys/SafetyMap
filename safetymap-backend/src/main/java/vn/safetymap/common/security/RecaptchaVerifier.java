package vn.safetymap.common.security;

import com.fasterxml.jackson.annotation.JsonProperty; // Jackson 3 vẫn giữ annotation ở package cũ
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import vn.safetymap.common.config.SafetymapProperties;
import vn.safetymap.common.exception.BadRequestException;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class RecaptchaVerifier {
    private final RestClient restClient;
    private final SafetymapProperties.Recaptcha config;

    public RecaptchaVerifier(SafetymapProperties properties) {
        this.config = properties.recaptcha();

        // Set a timeout so that a slow response from Google doesn't cause the
        // registration request to hang.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    // Invalid -> 400; frontend displays a message and resets the captcha widget
    public void verify(String token) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", config.secret());
        form.add("response", token);

        SiteVerifyResponse result;
        try {
            // Google requires a form-encoded POST request, not JSON.
            result = restClient.post()
                    .uri(config.verifyUrl())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(SiteVerifyResponse.class);
        } catch (RestClientException e) {
            log.warn("Unable to call reCAPTCHA siteverify", e);
            throw captchaFailed();
        }

        if (result == null || !result.success()) {
            log.info("reCAPTCHA rejected: {}", result == null ? "no response" : result.errorCodes());
            throw captchaFailed();
        }
    }

    private static BadRequestException captchaFailed() {
        return new BadRequestException("CAPTCHA_FAILED", "reCAPTCHA verification failed; please try again.");
    }

    public record SiteVerifyResponse(
            boolean success,
            @JsonProperty("error-codes") List<String> errorCodes) {
    }
}
