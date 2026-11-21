package vn.safetymap.geography.entity;


import java.text.Normalizer;
import java.time.OffsetDateTime;

import org.locationtech.jts.geom.Polygon;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.safetymap.common.config.GeometryConfig;

import java.util.Arrays;

@Entity 
@Table(name = "junctions")
@Getter 
@NoArgsConstructor (access = AccessLevel.PROTECTED)
public class Junction {
    /* Length a route is charged for passing through a junction. */
    public static final double DEFAULT_EQUIVALENT_LENGTH_M = 100.0;

    static final int NAME_MAX_LENGTH = 200;

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne (fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "map_import_id", nullable = false)
    private MapImport mapImport;

    @ManyToOne (fetch = FetchType.LAZY, optional = false)
    @JoinColumn (name = "ward_id")
    private Ward ward;

    @Enumerated (EnumType.STRING)
    @Column(name = "junction_type", nullable = false, updatable = false, length = 20)
    private JunctionType junctionType;

    @Column (name = "name", length = NAME_MAX_LENGTH)
    private String name;

    @Column (name ="osm_way_id", updatable = false)
    private Long osmWayId;

    @Getter(AccessLevel.NONE)
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column (name = "node_ids", nullable = false)
    private long[] nodeIds;

    @Column (name = "zone", nullable = false)
    private Polygon zone;

    @Column (name ="equivalent_length_m", nullable = false)
    private Double equivalentLengthM = DEFAULT_EQUIVALENT_LENGTH_M;

    @Column (name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    /** A roundabout: an OSM way tagged junction=roundabout. */
    public static Junction roundabout(MapImport mapImport, long osmWayId, String name, long[] nodeIds, Polygon zone){
        Junction junction = new Junction();
        junction.junctionType = JunctionType.ROUNDABOUT;
        junction.osmWayId = osmWayId;
        junction.apply(mapImport, name, nodeIds,zone);
        junction.checkInvariants();
        return junction;
    }

    /** A cluster of intersections within the merge distance of each other; it has no OSM way. */
    public static Junction cluster(MapImport mapImport, String name, long[] nodeIds, Polygon zone){
       Junction junction = new Junction();
        junction.junctionType = JunctionType.CLUSTER;
        junction.apply(mapImport, name, nodeIds, zone);
        junction.checkInvariants();
        return junction;
    }

    // Bussiness methods

    /**
     * Re-import matched this junction: keep the id (so junction_scores and incidents stay linked)
     * and refresh what the new map data says. Type and OSM way never change.
     */
    public void rematch(MapImport mapImport, String name, long[] nodeIds, Polygon zone){
        apply(mapImport, name, nodeIds, zone);
        checkInvariants();
    }

    public void assignWard(Ward ward){
        this.ward = ward;
    }

    public long[] getNodeIds(){
        return nodeIds == null ? null : nodeIds.clone();
    }


    // Internals
    public void apply(MapImport mapImport, String name, long[] nodeIds, Polygon zone ){
        this.mapImport = mapImport;
        this.name = normalizeName(name);
        this.nodeIds = sortedCopy(nodeIds);
        this.zone = zone;
    }
    /** Copy first (the caller keeps its array), then sort so the stored order never depends on input order. */
    public static long[] sortedCopy(long[] ids){
        if(ids == null)
            return null;
        
        long[] copy = ids.clone();
        Arrays.sort(copy);
        return copy;
    }

    /** Same rule as street names: trim, NFC-normalize, blank becomes null. */
    private static String normalizeName(String raw){
        if (raw == null)
            return null;
        String normalize = Normalizer.normalize(raw.strip(), Normalizer.Form.NFC);
        return normalize.isEmpty() ? null : normalize;
    }
    @PrePersist 
    @PreUpdate 
    void checkInvariants() {
        if (mapImport == null) {
            throw new IllegalStateException("Junction requires a map import");
        }
        if (junctionType == null) {
            throw new IllegalStateException("Junction requires a type");
        }
        // Mirrors CHECK ck_junctions_type_osm_way
        if ((junctionType == JunctionType.ROUNDABOUT) != (osmWayId != null)) {
            throw new IllegalStateException("osmWayId is required for ROUNDABOUT and forbidden for CLUSTER");
        }
        if (osmWayId != null && osmWayId <= 0) {
            throw new IllegalStateException("osmWayId must be positive: " + osmWayId);
        }
        if (nodeIds == null || nodeIds.length == 0) {
            throw new IllegalStateException("Junction requires at least one node id");
        }
        for (int i = 0; i < nodeIds.length; i++) {
            if (nodeIds[i] <= 0) {
                throw new IllegalStateException("Node id must be positive: " + nodeIds[i]);
            }
            // Array is sorted, so a duplicate sits right next to its twin
            if (i > 0 && nodeIds[i] == nodeIds[i - 1]) {
                throw new IllegalStateException("Duplicate node id: " + nodeIds[i]);
            }
        }
        if (name != null && name.length() > NAME_MAX_LENGTH) {
            throw new IllegalStateException("Name longer than " + NAME_MAX_LENGTH + " characters");
        }
        // isValid() returns true for an empty geometry, so check emptiness first
        if (zone == null || zone.isEmpty()) {
            throw new IllegalStateException("Junction requires a non-empty zone");
        }
        if (zone.getSRID() != GeometryConfig.WGS84_SRID) {
            throw new IllegalStateException("Zone SRID must be " + GeometryConfig.WGS84_SRID + ", was " + zone.getSRID());
        }
        if (!zone.isValid()) {
            throw new IllegalStateException("Zone is not a valid polygon");
        }
        // NaN passes "> 0" in PostgreSQL, so check finiteness here
        if (equivalentLengthM == null || !Double.isFinite(equivalentLengthM) || equivalentLengthM <= 0) {
            throw new IllegalStateException("equivalentLengthM must be a finite number > 0: " + equivalentLengthM);
        }
    }
}
