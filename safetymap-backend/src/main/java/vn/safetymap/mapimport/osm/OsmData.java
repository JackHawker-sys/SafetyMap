package vn.safetymap.mapimport.osm;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import it.unimi.dsi.fastutil.longs.Long2LongOpenHashMap;

/**
 * Result of reading an OSM file: the road ways to import and the coordinates of
 * every node they use.
 *
 * <p>
 * Guarantees, checked once at construction so later stages never re-check:
 * ways are sorted by id with no duplicates, and every node of every way has a
 * coordinate.
 *
 * <p>
 * Immutable after construction; safe to read from several threads.
 * The fastutil map stays private so callers only see {@link OsmNode}.
 */
public class OsmData {
    /**
     * Marks "no coordinate"; never a real packed value because its latitude would
     * be about -214 degrees.
     */
    static final long MISSING = Long.MIN_VALUE;

    private final List<OsmWay> ways;
    private final Long2LongOpenHashMap packedCoordinates;
    private final Instant osmDataAt;
    private final int skippedWayCount;

    /**
     * Fast path for the reader: takes ownership of the map without copying it (it
     * can hold millions of nodes).
     * The caller must not touch the map afterwards.
     */
    OsmData(List<OsmWay> ways, Long2LongOpenHashMap packedCoordinates, Instant osmDataAt, int skippedWayCount) {
        if (ways == null) {
            throw new IllegalArgumentException("ways must not be null");
        }
        if (packedCoordinates == null) {
            throw new IllegalArgumentException("packedCoordinates must not be null");
        }
        if (osmDataAt == null) {
            throw new IllegalArgumentException("osmDataAt is required (replication timestamp of the OSM file)");
        }
        if (skippedWayCount < 0) {
            throw new IllegalArgumentException("skippedWayCount must be >= 0, got " + skippedWayCount);
        }
        packedCoordinates.defaultReturnValue(MISSING);
        checkSortedAndComplete(ways, packedCoordinates);

        this.ways = List.copyOf(ways);
        this.packedCoordinates = packedCoordinates;
        this.osmDataAt = osmDataAt;
        this.skippedWayCount = skippedWayCount;

    }

     /**
     * Safe path for tests and small data: builds its own coordinate map from the given nodes.
     *
     * @throws IllegalArgumentException if a node id appears twice
     */
    public static OsmData of(List<OsmWay> ways, Collection<OsmNode> nodes, Instant osmDataAt, int skippedWayCount){
        if(nodes == null){
            throw new IllegalArgumentException("nodes must not be null");
        }
        Long2LongOpenHashMap map = new Long2LongOpenHashMap(nodes.size());
        map.defaultReturnValue(MISSING);
        for(OsmNode node : nodes){
            if(node == null){
                throw new IllegalArgumentException("nodes must not contain null");
            }
            long previous = map.put(node.id(), OsmNode.pack(node.latE7(), node.lonE7()));
            if(previous != MISSING){
                throw new IllegalArgumentException("node " + node.id() + " is given twice");
            }       
        }
        return new OsmData(ways, map, osmDataAt, skippedWayCount);
        
    }

    // One pass over the ways: non-null, strictly increasing id, every node has a coordinate
    private static void checkSortedAndComplete(List<OsmWay> ways, Long2LongOpenHashMap coordinates){
        long previousId = Long.MIN_VALUE;

        for(int i = 0; i < ways.size(); i++){
            OsmWay way = ways.get(i);
            if(way == null){
                throw new IllegalArgumentException("ways must not contain null (position " + i + ")");
            }
            if (i > 0 && way.id() <= previousId){
                throw new IllegalArgumentException("ways must be sorted by id without duplicates: way " + previousId + " at position " + (i - 1) + ", way " + way.id() + " at position " + i);
            }
            for (int j = 0; j < way.nodeCount(); j++) {
                if (!coordinates.containsKey(way.nodeId(j))) {
                    throw new IllegalArgumentException("way " + way.id() + " uses node " + way.nodeId(j) + " (position " + j + ") which has no coordinate");
                }
            }
            previousId = way.id();
        }
    }
    /** Road ways sorted by id; unmodifiable. */
    public List<OsmWay> ways() {
        return ways;
    }

    public int wayCount() {
        return ways.size();
    }

    /** Number of nodes with a coordinate (may include nodes no kept way uses). */
    public int nodeCount() {
        return packedCoordinates.size();
    }

    public boolean hasNode(long nodeId) {
        return packedCoordinates.containsKey(nodeId);
    }

    /**
     * Coordinate of a node.
     *
     * @throws IllegalArgumentException if the node has no coordinate (cannot happen for nodes of {@link #ways()})
     */
    public OsmNode node(long nodeId) {
        long packed = packedCoordinates.get(nodeId);
        if (packed == MISSING) {
            throw new IllegalArgumentException("no coordinate for node " + nodeId);
        }
        return OsmNode.unpack(nodeId, packed);
    }

    /** Replication timestamp from the file header; becomes map_imports.osm_data_at. */
    public Instant osmDataAt() {
        return osmDataAt;
    }

    /** Ways dropped by the reader (spikes, too few nodes, missing coordinates, ...). */
    public int skippedWayCount() {
        return skippedWayCount;
    }

    @Override
    public String toString() {
        return "OsmData[ways=" + ways.size() + ", nodes=" + packedCoordinates.size()
                + ", osmDataAt=" + osmDataAt + ", skippedWays=" + skippedWayCount + "]";
    } 
}
