package vn.safetymap.geography.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.safetymap.geography.entity.BlockSegment;

public interface BlockSegmentRepository extends JpaRepository<BlockSegment, Integer> {
}