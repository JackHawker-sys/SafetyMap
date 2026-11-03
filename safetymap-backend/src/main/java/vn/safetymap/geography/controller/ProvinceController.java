package vn.safetymap.geography.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.safetymap.geography.dto.ProvinceResponse;
import vn.safetymap.geography.dto.WardResponse;
import vn.safetymap.geography.service.ProvinceService;
import vn.safetymap.geography.service.WardService;

import java.util.List;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1/provinces")
@RequiredArgsConstructor

public class ProvinceController {
    private final ProvinceService provinceService;
    private final WardService wardService;

    @GetMapping
    public List<ProvinceResponse> findAll() {
        return provinceService.findAll();
    }

    @GetMapping("/{id}/wards")
    public List<WardResponse> findByProvince(@PathVariable Integer id) {
        return wardService.findByProvince(id);
    }

}
