package vn.safetymap.geography.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.safetymap.geography.entity.Street;

import java.util.List;

public interface StreetRepository extends JpaRepository<Street, Integer> {
      @Query("""
            SELECT s FROM Street s
            JOIN FETCH s.province
            WHERE s.province.id = :provinceId
              AND LOWER(s.name) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY s.name
            """)
    List<Street> searchInProvince(@Param("provinceId") Integer provinceId,
                                  @Param("q") String q,
                                  Pageable pageable);

      @Query("""
            SELECT s FROM Street s
            JOIN FETCH s.province
            WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY s.name
            """)
    List<Street> searchAllProvinces(@Param("q") String q, Pageable pageable);
}
