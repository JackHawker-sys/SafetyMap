package vn.safetymap.geography.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.safetymap.geography.entity.Province;

public interface ProvinceRepository extends JpaRepository<Province, Integer> {
}