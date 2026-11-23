package vn.safetymap.geography.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.safetymap.geography.entity.RoadSegment;

public interface RoadSegmentRepository extends JpaRepository<RoadSegment, Integer> {
    
}
