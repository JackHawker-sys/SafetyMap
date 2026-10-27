package vn.safetymap.geography.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.safetymap.geography.dto.ProvinceResponse;
import vn.safetymap.geography.repository.ProvinceRepository;

import java.util.List;

@Service
@RequiredArgsConstructor

public class ProvinceService {
    private final ProvinceRepository provinceRepository;

    @Transactional(readOnly = true)
    public List<ProvinceResponse> findAll() {
        return provinceRepository.findAll(Sort.by("name"))
                .stream()
                .map(p -> new ProvinceResponse(p.getId(),p.getCode(),p.getName(),p.getType()))
                .toList();
    }
}
