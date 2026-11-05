package vn.safetymap.geography.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.safetymap.common.config.GeometryConfig;

import org.locationtech.jts.geom.Polygon;
import java.time.Instant;

@Entity
@Table(name = "map_imports")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MapImport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Integer Id;

    @Column(name = "area_name", nullable = false, length = 150)
    private String areaName;

    @Column(name = "source_name", nullable = false, length = 200)
    private String sourceName;

    @Column(name = "osm_data_at", nullable = false)
    private Instant osmDataAt;

    @Column(name = "area_shape", nullable = false)
    private Polygon areaShape;

    @Setter(AccessLevel.NONE)
    @Column(name = "segment_count", nullable = false)
    private Integer segmentCount;

    @Setter(AccessLevel.NONE)
    @Column(name = "block_count", nullable = false)
    private Integer blockCount;

    @Setter(AccessLevel.NONE)
    @Column(name = "imported_at", insertable = false, nullable = false)
    private Instant importedAt;

    public MapImport(String areaName, String sourceName, Instant osmDataAt, Polygon areaShape) {
        MapImport mi = new MapImport();
        mi.areaName = areaName;
        mi.sourceName = sourceName;
        mi.osmDataAt = osmDataAt;
        mi.areaShape = areaShape;
    }

    public void recordResult(Integer segmentCount, Integer blockCount) {
        if (segmentCount <= 0 || blockCount < 0) {
            throw new IllegalArgumentException("count must be 0 or more!!!");
        }
        this.segmentCount = segmentCount;
        this.blockCount = blockCount;
    }

    @PrePersist
    @PreUpdate
    public void checkAreaShape() {
        if (areaShape == null) {
            throw new IllegalStateException("area shape is required");
        }
        if (areaShape.getSRID() != GeometryConfig.WGS84_SRID) {
            throw new IllegalStateException("area shape must use SRID 4326, got" + areaShape.getSRID());
        }
        if (!areaShape.isValid()) {
            throw new IllegalStateException("Area shape is not a valid polygon");
        }
    }
}
