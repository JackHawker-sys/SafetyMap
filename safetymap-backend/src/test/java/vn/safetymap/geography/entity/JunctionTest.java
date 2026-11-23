package vn.safetymap.geography.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import vn.safetymap.common.config.GeometryConfig;
import vn.safetymap.geography.entity.Junction;
class JunctionTest {

    private static final GeometryFactory GF = GeometryConfig.wgs84Factory();
    private static final long RING_WAY_ID = 123_456L;

    // ---------- helpers ----------

    /** A small valid square around (lon, lat), about 30 m wide near Binh Duong. */
    private static Polygon square(GeometryFactory factory, double lon, double lat) {
        double d = 0.00015;
        return factory.createPolygon(new Coordinate[] {
                new Coordinate(lon - d, lat - d),
                new Coordinate(lon + d, lat - d),
                new Coordinate(lon + d, lat + d),
                new Coordinate(lon - d, lat + d),
                new Coordinate(lon - d, lat - d) // ring must be closed
        });
    }

    private static Polygon zone() {
        return square(GF, 106.66638, 11.05241);
    }

    private static MapImport mapImport() {
        return MapImport.start("Binh Duong ward", "test", Instant.parse("2026-11-12T00:00:00Z"), zone());
    }

    private static Junction validRoundabout() {
        return Junction.roundabout(mapImport(), RING_WAY_ID, "Vòng xoay Phú Lợi", new long[] {30, 10, 20}, zone());
    }

    // ---------- happy paths ----------

    @Test
    void roundaboutKeepsItsRingWayAndSortsNodeIds() {
        Junction junction = validRoundabout();

        assertThat(junction.getJunctionType()).isEqualTo(JunctionType.ROUNDABOUT);
        assertThat(junction.getOsmWayId()).isEqualTo(RING_WAY_ID);
        assertThat(junction.getNodeIds()).containsExactly(10L, 20L, 30L);
    }

    @Test
    void clusterHasNoOsmWay() {
        Junction junction = Junction.cluster(mapImport(), null, new long[] {5, 7}, zone());

        assertThat(junction.getJunctionType()).isEqualTo(JunctionType.CLUSTER);
        assertThat(junction.getOsmWayId()).isNull();
    }

    @Test
    void equivalentLengthStartsAtTheColumnDefault() {
        assertThat(validRoundabout().getEquivalentLengthM()).isEqualTo(Junction.DEFAULT_EQUIVALENT_LENGTH_M);
    }

    @Test
    void factoryDoesNotReorderTheCallersArray() {
        // Design decision: defensive copy on the way in
        long[] callerIds = {30, 10, 20};

        Junction.cluster(mapImport(), null, callerIds, zone());

        assertThat(callerIds).containsExactly(30L, 10L, 20L);
    }

    @Test
    void changingTheReturnedArrayDoesNotChangeTheJunction() {
        // Design decision: defensive copy on the way out, so the match key cannot be edited from outside
        Junction junction = validRoundabout();

        long[] leaked = junction.getNodeIds();
        leaked[0] = 999L;

        assertThat(junction.getNodeIds()).containsExactly(10L, 20L, 30L);
    }

    @Test
    void nameIsTrimmedAndNfcNormalized() {
        // "o" + combining grave accent (NFD) must be stored as the single character "ò" (NFC)
        String decomposed = "  Vo\u0300ng xoay  ";

        Junction junction = Junction.cluster(mapImport(), decomposed, new long[] {1}, zone());

        assertThat(junction.getName()).isEqualTo("V\u00f2ng xoay");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void blankNameBecomesNull(String blank) {
        assertThat(Junction.cluster(mapImport(), blank, new long[] {1}, zone()).getName()).isNull();
    }

    @Test
    void rematchKeepsTypeAndRingWayButRefreshesTheRest() {
        Junction junction = validRoundabout();
        MapImport newer = mapImport();
        Polygon newZone = square(GF, 106.67, 11.06);

        junction.rematch(newer, "New name", new long[] {40, 10}, newZone);

        assertThat(junction.getJunctionType()).isEqualTo(JunctionType.ROUNDABOUT);
        assertThat(junction.getOsmWayId()).isEqualTo(RING_WAY_ID);
        assertThat(junction.getMapImport()).isSameAs(newer);
        assertThat(junction.getName()).isEqualTo("New name");
        assertThat(junction.getNodeIds()).containsExactly(10L, 40L);
        assertThat(junction.getZone()).isSameAs(newZone);
    }

    @Test
    void rematchValidatesItsInput() {
        Junction junction = validRoundabout();

        assertThatIllegalStateException()
                .isThrownBy(() -> junction.rematch(mapImport(), null, new long[0], zone()))
                .withMessageContaining("at least one node id");
    }

    // ---------- invariants: one wrong input per case ----------

    @Test
    void rejectsMissingMapImport() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(null, null, new long[] {1}, zone()))
                .withMessageContaining("map import");
    }

    @ParameterizedTest
    @ValueSource(longs = {0L, -1L})
    void rejectsNonPositiveRingWayId(long wayId) {
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.roundabout(mapImport(), wayId, null, new long[] {1}, zone()))
                .withMessageContaining("osmWayId must be positive");
    }

    @Test
    void rejectsNullNodeIds() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, null, zone()))
                .withMessageContaining("at least one node id");
    }

    @Test
    void rejectsEmptyNodeIds() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[0], zone()))
                .withMessageContaining("at least one node id");
    }

    @ParameterizedTest
    @ValueSource(longs = {0L, -5L})
    void rejectsNonPositiveNodeId(long badId) {
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[] {10, badId}, zone()))
                .withMessageContaining("Node id must be positive");
    }

    @Test
    void rejectsDuplicateNodeIds() {
        // Duplicates are not next to each other in the input; sorting brings them together
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[] {7, 3, 7}, zone()))
                .withMessageContaining("Duplicate node id: 7");
    }

    @Test
    void rejectsNameLongerThanTheColumn() {
        String tooLong = "a".repeat(Junction.NAME_MAX_LENGTH + 1);

        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), tooLong, new long[] {1}, zone()))
                .withMessageContaining("Name longer than");
    }

    @Test
    void acceptsNameOfExactlyTheColumnLength() {
        String atLimit = "a".repeat(Junction.NAME_MAX_LENGTH);

        assertThat(Junction.cluster(mapImport(), atLimit, new long[] {1}, zone()).getName()).hasSize(Junction.NAME_MAX_LENGTH);
    }

    @Test
    void rejectsNullZone() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[] {1}, null))
                .withMessageContaining("non-empty zone");
    }

    @Test
    void rejectsEmptyZone() {
        // An empty polygon is "valid" for JTS, so emptiness must be checked on its own
        Polygon empty = GF.createPolygon();

        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[] {1}, empty))
                .withMessageContaining("non-empty zone");
    }

    @Test
    void rejectsZoneWithWrongSrid() {
        GeometryFactory noSrid = new GeometryFactory(new PrecisionModel(), 0);

        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[] {1}, square(noSrid, 106.66, 11.05)))
                .withMessageContaining("SRID must be");
    }

    @Test
    void rejectsSelfIntersectingZone() {
        // Bow-tie: the ring crosses itself, so the polygon is invalid
        Polygon bowTie = GF.createPolygon(new Coordinate[] {
                new Coordinate(106.660, 11.050),
                new Coordinate(106.661, 11.051),
                new Coordinate(106.661, 11.050),
                new Coordinate(106.660, 11.051),
                new Coordinate(106.660, 11.050)
        });

        assertThatIllegalStateException()
                .isThrownBy(() -> Junction.cluster(mapImport(), null, new long[] {1}, bowTie))
                .withMessageContaining("not a valid polygon");
    }
}