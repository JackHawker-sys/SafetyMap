package vn.safetymap.geography.service;

import lombok.RequiredArgsConstructor; // auto generated constructor.
import org.springframework.http.HttpStatus; // Enum that contain HTTP codes such as 200(ok), 404(NOT FOUND), ...
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service; // auto create bean for other class inject into this. Use when need to resolve the business logic or class between the repository and controller layer 
import org.springframework.transaction.annotation.Transactional; // cover a method in a transaction(if an error happens, rollback)
import org.springframework.web.server.ResponseStatusException; // helps Spring automatically return fail response to the client with http status code

import vn.safetymap.geography.dto.WardResponse;
import vn.safetymap.geography.repository.ProvinceRepository;
import vn.safetymap.geography.repository.WardRepository;

import java.util.List;

@Service // help spring know this is a bean that resolve the logic
@RequiredArgsConstructor // create constructor for 2 "final field"
public class WardService {
    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;

    @Transactional(readOnly = true)
    public List<WardResponse> findByProvince(Integer provinceId) {
        if (!provinceRepository.existsById(provinceId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Province not found");
        }
        return wardRepository.findByProvinceIdOrderByNameAsc(provinceId)
                .stream()
                .map(w -> new WardResponse(w.getId(), w.getName(), w.getCode(), w.getType()))
                .toList();
    }
}
