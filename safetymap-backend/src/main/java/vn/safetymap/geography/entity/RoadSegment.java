package vn.safetymap.geography.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;
import org.locationtech.jts.geom.LineString;

import vn.safetymap.common.config.GeometryConfig;
@Entity 
@Table(name ="road_segments")
@Getter 
@NoArgsConstructor

public class RoadSegment {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn (name ="street_id", nullable = false)
    private Street street;

    @ManyToOne (fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "map_import_id")
    private MapImport mapImport;

    @Column(name = "osm_way_id", nullable = false, updatable = false)
    private Long osmWayId;

    @Column(name = "segment_order", nullable = false)
    private Integer segmentOrder;

    @Column(name = "start_node_id", nullable = false, updatable = false)
    private Long startNodeId;

    @Column(name = "end_node_id", nullable = false, updatable = false)
    private Long endNodeId;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "start_latitude", insertable = false, updatable = false)
    private Double startLatitude;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "start_longitude", insertable = false, updatable = false)
    private Double startLongitude;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "end_latitude", insertable = false, updatable = false)
    private Double endLatitude;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "end_longitude", insertable = false, updatable = false)
    private Double endLongitude;

    @Column(name = "length_m", nullable = false)
    private Double lengthM;

    @Enumerated(EnumType.STRING)
    @Column(name = "road_class", nullable = false, length = 20)
    private RoadClass roadClass;

    @Column(name = "road_shape", nullable = false)
    private LineString roadShape;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public static RoadSegment create(Street street, MapImport mapImport,
                                     Long osmWayId, Integer segmentOrder,
                                     Long startNodeId, Long endNodeId,
                                     RoadClass roadClass, LineString roadShape, Double lengthM) {
        RoadSegment s = new RoadSegment();
        s.street = street;
        s.mapImport = mapImport;
        s.osmWayId = osmWayId;
        s.segmentOrder = segmentOrder;
        s.startNodeId = startNodeId;
        s.endNodeId = endNodeId;
        s.roadClass = roadClass;
        s.roadShape = roadShape;
        s.lengthM = lengthM;
        s.checkInvariants();
        return s;
    }

    public void assignWard(Ward ward) {
        this.ward = ward;
    }

    /* startNodeId == endNodeId is allowed on purpose: a closed roundabout
    connected at a single node starts and ends at the same OSM node. */
    @PrePersist
    @PreUpdate
    void checkInvariants() {
        if (street == null) {
            throw new IllegalStateException("street is required");
        }
        if (osmWayId == null || startNodeId == null || endNodeId == null) {
            throw new IllegalStateException("osmWayId, startNodeId and endNodeId are required");
        }
        if (segmentOrder == null || segmentOrder < 0) {
            throw new IllegalStateException("segmentOrder must be 0 or more, got " + segmentOrder);
        }
        if (roadClass == null) {
            throw new IllegalStateException("roadClass is required");
        }
        if (lengthM == null || !Double.isFinite(lengthM) || lengthM <= 0) {
            throw new IllegalStateException("lengthM must be greater than 0, got " + lengthM);
        }
        if (roadShape == null || roadShape.isEmpty()) {
            throw new IllegalStateException("road shape is required");
        }
        if (roadShape.getSRID() != GeometryConfig.WGS84_SRID) {
            throw new IllegalStateException("road shape must use SRID 4326, got " + roadShape.getSRID());
        }
        if (!roadShape.isValid()) {
            throw new IllegalStateException("road shape is not a valid line");
        }
    }
}
