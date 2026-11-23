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
import vn.safetymap.common.config.GeometryConfig;

import org.locationtech.jts.geom.Polygon;
import java.time.Instant;

@Entity
@Table(name = "map_imports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MapImport {
    

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "area_name", nullable = false, length = 150)
    private String areaName;

    @Column(name = "source_name", nullable = false, length = 200)
    private String sourceName;

    @Column(name = "osm_data_at", nullable = false)
    private Instant osmDataAt;

    @Column(name = "area_shape", nullable = false)
    private Polygon areaShape;

    @Column(name = "segment_count", nullable = false)
    private Integer segmentCount = 0;

    @Column(name = "block_count", nullable = false)
    private Integer blockCount = 0;

    @Column (name = "junction_count", nullable = false)
    private Integer junctionCount = 0;

    @Column(name = "imported_at", insertable = false, updatable = false)
    private Instant importedAt;

    public static MapImport start(String areaName, String sourceName, Instant osmDataAt, Polygon areaShape) {
        MapImport mi = new MapImport();
        mi.areaName = areaName == null ? null : areaName.strip();
        mi.sourceName = sourceName == null ? null : sourceName.strip();
        mi.osmDataAt = osmDataAt;
        mi.areaShape = areaShape;
        mi.checkInvariants();
        return mi;
    }

    public void recordResult(int segmentCount, int blockCount, int junctionCount) {
        if (segmentCount < 0 || blockCount < 0) {
            throw new IllegalArgumentException("count must be 0 or more!!!");
        }
        this.segmentCount = segmentCount;
        this.blockCount = blockCount;
        this.junctionCount = junctionCount;
    }

    @PrePersist
    @PreUpdate
    void checkInvariants() {
        if (areaName == null || areaName.isEmpty()) {
            throw new IllegalStateException("areaName is required");
        }
        if (areaName.length() > 150) {
            throw new IllegalStateException("areaName longer than 150 characters");
        }
        if (sourceName == null || sourceName.isEmpty()) {
            throw new IllegalStateException("sourceName is required");
        }
        if (sourceName.length() > 200) {
            throw new IllegalStateException("sourceName longer than 200 characters");
        }
        if (osmDataAt == null) {
            throw new IllegalStateException("osmDataAt is required");
        }
        // isValid() returns true for an empty geometry, so check emptiness first
        if (areaShape == null || areaShape.isEmpty()) {
            throw new IllegalStateException("area shape is required");
        }
        if (areaShape.getSRID() != GeometryConfig.WGS84_SRID) {
            throw new IllegalStateException("area shape must use SRID 4326, got " + areaShape.getSRID());
        }
        if (!areaShape.isValid()) {
            throw new IllegalStateException("area shape is not a valid polygon");
        }
    }
}
