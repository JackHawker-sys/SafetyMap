package vn.safetymap.geography.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.safetymap.geography.dto.ProvinceResponse;
import vn.safetymap.geography.service.ProvinceService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/provinces")
@RequiredArgsConstructor

public class ProvinceController {   
    private final ProvinceService provinceService;

    @GetMapping
    public List<ProvinceResponse> findAll(){
        return provinceService.findAll();
    }
}
