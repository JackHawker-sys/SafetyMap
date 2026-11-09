package vn.safetymap.geography.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.locationtech.jts.geom.Polygon;

import vn.safetymap.common.config.GeometryConfig;
@Entity 
@Table(name ="blocks")
@Getter 
@NoArgsConstructor(access = AccessLevel.NONE)

public class Block {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "map_import_id", nullable = false)
    private MapImport mapImport;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    /** Outline of the block, SRID 4326. Holes are allowed (a block can enclose another). */
    @Column(name = "shape", nullable = false)
    private Polygon shape;

    /** Area in square metres, computed on the geography type; always finite and greater than 0. */
    @Column(name = "area_m2", nullable = false)
    private Double areaM2;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public static Block create(MapImport mapImport, Polygon shape, Double areaM2) {
        Block b = new Block();
        b.mapImport = mapImport;
        b.shape = shape;
        b.areaM2 = areaM2;
        b.checkInvariants();
        return b;
    }

    public void assignWard(Ward ward){
        this.ward = ward;
    }

    @PrePersist
    @PreUpdate 
    public void checkInvariants() {
        if (mapImport == null) {
            throw new IllegalStateException("mapImport is required");
        }
        
        if (areaM2 == null || !Double.isFinite(areaM2) || areaM2 <= 0) {
            throw new IllegalStateException("areaM2 must be greater than 0, got " + areaM2);
        }
       
        if (shape == null || shape.isEmpty()) {
            throw new IllegalStateException("block shape is required");
        }
        if (shape.getSRID() != GeometryConfig.WGS84_SRID) {
            throw new IllegalStateException("block shape must use SRID 4326, got " + shape.getSRID());
        }
       
        if (!shape.isValid()) {
            throw new IllegalStateException("block shape is not a valid polygon");
        }
    }
}
