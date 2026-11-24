package vn.safetymap.mapimport.osm;

import java.util.Arrays;
import java.util.Objects;
import vn.safetymap.geography.entity.RoadClass;

/**
 * An OSM way that is a road we import, with its tags already translated to domain values.
 *
 * <p>Part of the anti-corruption layer: tag parsing ("7 m", "junction=roundabout", highway=...)
 * happens once in mapimport.osm; GraphBuilder and later steps never read raw OSM tags.
 *
 * @param id         OSM way id (positive)
 * @param nodeIds    ordered OSM node ids along the way; a closed way repeats its first node at the end
 * @param roadClass  road class mapped from the highway tag
 * @param name       street name as tagged (may be null); NFC normalization happens when streets are upserted
 * @param widthM     width from the OSM width tag in metres, or null when not tagged
 * @param lanes      number of lanes from the OSM lanes tag, or null when not tagged
 * @param roundabout true when tagged junction=roundabout (design v2.10: becomes a ROUNDABOUT junction)
 */
public record OsmWay(long id, long[] nodeIds, RoadClass roadClass, String name,
                     Double widthM, Integer lanes, boolean roundabout) {

    /** Fail fast on input the graph cannot use. Cheap checks first, the O(n) node loop last. */
    public OsmWay {
        if (id <= 0) {
            throw new IllegalArgumentException("OSM way id must be positive: " + id);
        }
        if (roadClass == null) {
            throw new IllegalArgumentException("Way " + id + " needs a road class");
        }
        if (widthM != null && (!Double.isFinite(widthM) || widthM <= 0)) {
            throw new IllegalArgumentException("Way " + id + " has an invalid width: " + widthM);
        }
        if (lanes != null && lanes <= 0) {
            throw new IllegalArgumentException("Way " + id + " has an invalid lane count: " + lanes);
        }
        if (nodeIds == null || nodeIds.length < 2) {
            throw new IllegalArgumentException("Way " + id + " needs at least 2 nodes");
        }
        // Defensive copy on the way in: the caller keeps its array, we keep ours
        nodeIds = nodeIds.clone();
        // One pass over the nodes: positive ids, and no consecutive duplicates,
        // which would become zero-length edges (the parser collapses them before calling us)
        for (int i = 0; i < nodeIds.length; i++) {
            if (nodeIds[i] <= 0) {
                throw new IllegalArgumentException("Way " + id + " has a non-positive node id: " + nodeIds[i]);
            }
            if (i > 0 && nodeIds[i] == nodeIds[i - 1]) {
                throw new IllegalArgumentException(
                        "Way " + id + " repeats node " + nodeIds[i] + " at positions " + (i - 1) + " and " + i);
            }
        }
        /// With no consecutive duplicates, a closed way of length >= 4 has at least 3 distinct nodes
        // in its smallest form [A, B, C, A]: C differs from B (its neighbour) and from A (the last node).
        if (nodeIds[0] == nodeIds[nodeIds.length - 1] && nodeIds.length < 4) {
            throw new IllegalArgumentException("Closed way " + id + " needs at least 3 distinct nodes");
        }
    }

    /** Defensive copy on the way out. In loops, prefer nodeCount() and nodeId(i), which do not copy. */
    @Override
    public long[] nodeIds() {
        return nodeIds.clone();
    }

    /** Number of nodes along the way, without copying the array. */
    public int nodeCount() {
        return nodeIds.length;
    }

    /** Node id at position i (0 = first node), without copying the array. */
    public long nodeId(int i) {
        return nodeIds[i];
    }

    /** First node id; a cut point of every way. */
    public long firstNodeId() {
        return nodeIds[0];
    }

    /** Last node id; a cut point of every way. */
    public long lastNodeId() {
        return nodeIds[nodeIds.length - 1];
    }

    /** True when the way ends where it starts (a roundabout ring, a loop road). */
    public boolean isClosed() {
        return firstNodeId() == lastNodeId();
    }

    // Records compare arrays by reference; compare node ids by content instead.
    // Cheap fields first, the O(n) array comparison last, so most unequal ways exit early.

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof OsmWay other)) {
            return false;
        }
        return id == other.id
                && roundabout == other.roundabout
                && roadClass == other.roadClass
                && Objects.equals(lanes, other.lanes)
                && Objects.equals(widthM, other.widthM)
                && Objects.equals(name, other.name)
                && Arrays.equals(nodeIds, other.nodeIds);
    }

    // Written by hand instead of Objects.hash(...): no varargs array and no boxing per call.
    @Override
    public int hashCode() {
        int result = Long.hashCode(id);
        result = 31 * result + Arrays.hashCode(nodeIds);
        result = 31 * result + roadClass.hashCode();
        result = 31 * result + Objects.hashCode(name);
        result = 31 * result + Objects.hashCode(widthM);
        result = 31 * result + Objects.hashCode(lanes);
        result = 31 * result + Boolean.hashCode(roundabout);
        return result;
    }

    /** Prints the node count, not the node ids: a long way has hundreds of them. */
    @Override
    public String toString() {
        return "OsmWay[id=" + id + ", nodes=" + nodeIds.length + ", roadClass=" + roadClass
                + ", name=" + name + ", widthM=" + widthM + ", lanes=" + lanes + ", roundabout=" + roundabout + "]";
    }
}