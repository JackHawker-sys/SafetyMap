package vn.safetymap.geography.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import vn.safetymap.geography.dto.StreetResponse;
import vn.safetymap.geography.service.StreetService;

import java.util.List;

@RestController
@RequestMapping("api/v1/streets")
@RequiredArgsConstructor
@Validated

public class StreetController {
    private StreetService streetService;

    @GetMapping
    public List<StreetResponse> search(
            @RequestParam(required = false) Integer provinceId,
            @RequestParam @NotBlank @Size(min = 2, max = 100) String q) {
        return streetService.search(provinceId, q);
    }
}
