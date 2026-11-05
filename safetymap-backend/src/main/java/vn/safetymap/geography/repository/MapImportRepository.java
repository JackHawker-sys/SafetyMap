package vn.safetymap.geography.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.safetymap.geography.entity.MapImport;

public interface MapImportRepository extends JpaRepository<MapImport, Integer> {

}
