package vn.safetymap.mapimport.osm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import it.unimi.dsi.fastutil.longs.Long2LongOpenHashMap;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import vn.safetymap.geography.entity.RoadClass;

class OsmDataTest {

    private static final Instant AT = Instant.parse("2026-11-12T00:00:00Z");

    private static final OsmNode A = OsmNode.ofDegrees(1L, 11.05241, 106.66638);
    private static final OsmNode B = OsmNode.ofDegrees(2L, 11.05300, 106.66700);
    private static final OsmNode C = OsmNode.ofDegrees(3L, 11.05400, 106.66800);

    private static OsmWay way(long id, long... nodeIds) {
        return new OsmWay(id, nodeIds, RoadClass.RESIDENTIAL, null, null, null, false);
    }

    // Happy path 

    @Test
    void ofExposesWaysAndNodeCoordinates() {
        OsmData data = OsmData.of(List.of(way(10, 1, 2), way(20, 2, 3)), List.of(A, B, C), AT, 4);

        assertThat(data.ways()).extracting(OsmWay::id).containsExactly(10L, 20L);
        assertThat(data.wayCount()).isEqualTo(2);
        assertThat(data.nodeCount()).isEqualTo(3);
        assertThat(data.hasNode(2L)).isTrue();
        assertThat(data.hasNode(99L)).isFalse();
        assertThat(data.node(2L)).isEqualTo(B);
        assertThat(data.osmDataAt()).isEqualTo(AT);
        assertThat(data.skippedWayCount()).isEqualTo(4);
    }

    @Test
    void negativeCoordinatesSurvivePacking() {
        // A negative longitude must not sign-extend over the latitude bits
        OsmNode southWest = OsmNode.ofDegrees(7L, -33.8688, -70.6693);
        OsmData data = OsmData.of(List.of(), List.of(southWest), AT, 0);
        assertThat(data.node(7L)).isEqualTo(southWest);
    }

    @Test
    void emptyWaysAndUnusedNodesAreAllowed() {
        // Design decision: OsmData only holds data; MapImportService decides whether an empty area is an error
        OsmData data = OsmData.of(List.of(), List.of(A), AT, 0);
        assertThat(data.wayCount()).isZero();
        assertThat(data.nodeCount()).isEqualTo(1);
    }

    // Immutability 

    @Test
    void waysCannotBeModified() {
        OsmData data = OsmData.of(List.of(way(10, 1, 2)), List.of(A, B), AT, 0);
        assertThatThrownBy(() -> data.ways().add(way(30, 1, 2)))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void changingTheCallersListAfterwardsDoesNotChangeTheData() {
        List<OsmWay> ways = new ArrayList<>(List.of(way(10, 1, 2)));
        OsmData data = OsmData.of(ways, List.of(A, B), AT, 0);
        ways.clear();
        assertThat(data.wayCount()).isEqualTo(1);
    }

    // Way order

    @Test
    void rejectsWaysOutOfOrder() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(way(20, 1, 2), way(10, 2, 3)), List.of(A, B, C), AT, 0))
                .withMessageContaining("ways must be sorted by id without duplicates: way 20 at position 0, way 10");
    }

    @Test
    void rejectsDuplicateWayIds() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(way(10, 1, 2), way(10, 2, 3)), List.of(A, B, C), AT, 0))
                .withMessageContaining("sorted by id without duplicates");
    }

    // Missing coordinates 

    @Test
    void rejectsWayUsingNodeWithoutCoordinate() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(way(10, 1, 2, 3)), List.of(A, B), AT, 0))
                .withMessageContaining("way 10 uses node 3 (position 2) which has no coordinate");
    }

    @Test
    void nodeWithoutCoordinateThrows() {
        OsmData data = OsmData.of(List.of(), List.of(A), AT, 0);
        assertThatIllegalArgumentException()
                .isThrownBy(() -> data.node(99L))
                .withMessageContaining("no coordinate for node 99");
    }

    @Test
    void readerMapWithoutDefaultValueStillReportsMissingNodes() {
        // A new fastutil map returns 0 for missing keys; 0 unpacks to a VALID node at (0, 0).
        // The constructor must set the MISSING default itself, or this would silently return that node.
        Long2LongOpenHashMap map = new Long2LongOpenHashMap();
        map.put(A.id(), A.packed());
        OsmData data = new OsmData(List.of(), map, AT, 0);

        assertThat(data.hasNode(99L)).isFalse();
        assertThatIllegalArgumentException()
                .isThrownBy(() -> data.node(99L))
                .withMessageContaining("no coordinate for node 99");
    }

    // Input of of(...)

    @Test
    void rejectsNullNodes() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(), null, AT, 0))
                .withMessageContaining("nodes must not be null");
    }

    @Test
    void rejectsNullNodeElement() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(), Arrays.asList(A, null), AT, 0))
                .withMessageContaining("nodes must not contain null");
    }

    @Test
    void rejectsNodeGivenTwice() {
        OsmNode sameIdElsewhere = OsmNode.ofDegrees(1L, 10.0, 106.0);
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(), List.of(A, sameIdElsewhere), AT, 0))
                .withMessageContaining("node 1 is given twice");
    }

    // Constructor arguments (one wrong input each) 

    @Test
    void rejectsNullWays() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(null, List.of(A), AT, 0))
                .withMessageContaining("ways must not be null");
    }

    @Test
    void rejectsNullWayElement() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(Arrays.asList(way(10, 1, 2), null), List.of(A, B), AT, 0))
                .withMessageContaining("ways must not contain null (position 1)");
    }

    @Test
    void rejectsNullOsmDataAt() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(), List.of(A), null, 0))
                .withMessageContaining("osmDataAt is required");
    }

    @Test
    void rejectsNegativeSkippedWayCount() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmData.of(List.of(), List.of(A), AT, -1))
                .withMessageContaining("skippedWayCount must be >= 0");
    }

    @Test
    void toStringShowsCountsNotContent() {
        OsmData data = OsmData.of(List.of(way(10, 1, 2)), List.of(A, B), AT, 3);
        assertThat(data.toString())
                .isEqualTo("OsmData[ways=1, nodes=2, osmDataAt=2026-11-12T00:00:00Z, skippedWays=3]");
    }
}