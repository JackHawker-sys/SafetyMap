package vn.safetymap.geography.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.safetymap.geography.entity.Ward;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, Integer> {

    List<Ward> findByProvinceIdOrderByNameAsc(Integer provinceId);
}
