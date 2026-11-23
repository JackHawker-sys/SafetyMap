package vn.safetymap.geography.entity;

/**
 * <p>
 * The kind decides how a junction is matched when an area is imported again:
 * a roundabout by its OSM ring way, a cluster by the intersections it contains.
 */
public enum JunctionType {

    /** An OSM way tagged junction=roundabout; junctions.osm_way_id is required. */
    ROUNDABOUT,
    /**
     * Intersections close enough (merge distance, proposed 25 m) to count as one
     * place; no OSM way of its own.
     */
    CLUSTER
}