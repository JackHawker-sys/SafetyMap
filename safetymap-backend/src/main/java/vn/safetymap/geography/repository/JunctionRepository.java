package vn.safetymap.geography.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.safetymap.geography.entity.Junction;

public interface JunctionRepository extends JpaRepository<Junction, Integer> {
}