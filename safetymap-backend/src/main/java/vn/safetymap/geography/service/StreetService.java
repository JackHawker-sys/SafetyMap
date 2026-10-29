package vn.safetymap.geography.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.safetymap.geography.entity.Street;
import vn.safetymap.geography.dto.StreetResponse;
import vn.safetymap.geography.repository.StreetRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StreetService {

    public static final Integer max_value = 20;

    private final StreetRepository repository;

    @Transactional(readOnly = true)
    public List<StreetResponse> search(Integer provinceId, String q) {
        String keyword = q.trim();
        PageRequest page = PageRequest.of(0, max_value);

        List<Street> streets = (provinceId == null) ? repository.searchAllProvinces(keyword, page)
                : repository.searchInProvince(provinceId, keyword, page);
        return streets.stream().map(this::toResponse).toList();

    }

    private StreetResponse toResponse(Street s) {
        Integer parentId = s.getParentStreet() == null ? null : s.getParentStreet().getId();
        return new StreetResponse(s.getId(), s.getName(), s.getStreetType(), parentId,
                s.getProvince().getId(), s.getProvince().getName());
    }

}
