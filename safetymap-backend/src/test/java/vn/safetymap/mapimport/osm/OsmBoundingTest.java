package vn.safetymap.mapimport.osm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class OsmBoundingBoxTest {

    // Small integer box so edge cases are easy to read: lat 100..300, lon 200..400 (E7 units)
    private static final OsmBoundingBox BOX = new OsmBoundingBox(100, 200, 300, 400);

    // Real box of Binh Duong ward expanded ~500 m (Phase 3 decision 3.2)
    private static final OsmBoundingBox BINH_DUONG =
            OsmBoundingBox.ofDegrees(10.99156, 106.64822, 11.11790, 106.72784);

    // Contains 

    @ParameterizedTest
    @CsvSource({
            // corners and centre are inside (edges inclusive)
            "100, 200, true", "100, 400, true", "300, 200, true", "300, 400, true", "200, 300, true",
            // one unit outside each edge
            "99, 300, false",  // south
            "301, 300, false", // north
            "200, 199, false", // west
            "200, 401, false"  // east
    })
    void containsIncludesEdgesAndExcludesOneUnitOutside(int latE7, int lonE7, boolean expected) {
        assertThat(BOX.contains(latE7, lonE7)).isEqualTo(expected);
    }

    @Test
    void containsNodeUsesItsCoordinates() {
        OsmNode eiu = OsmNode.ofDegrees(1L, 11.05241, 106.66638);
        OsmNode saigonCentre = OsmNode.ofDegrees(2L, 10.77600, 106.70100);
        assertThat(BINH_DUONG.contains(eiu)).isTrue();
        assertThat(BINH_DUONG.contains(saigonCentre)).isFalse();
    }

    // ofDegrees / format ----------

    @Test
    void ofDegreesStoresE7() {
        assertThat(BINH_DUONG.southE7()).isEqualTo(109_915_600);
        assertThat(BINH_DUONG.westE7()).isEqualTo(1_066_482_200);
        assertThat(BINH_DUONG.northE7()).isEqualTo(111_179_000);
        assertThat(BINH_DUONG.eastE7()).isEqualTo(1_067_278_400);
    }

    @Test
    void formatIsSouthWestNorthEastWithoutSpacesOrTrailingZeros() {
        assertThat(BINH_DUONG.format()).isEqualTo("10.99156,106.64822,11.1179,106.72784");
    }

    @Test
    void formatHandlesNegativeZeroAndWholeDegrees() {
        // -180 must not become "-1.8E+2"; 0 must be "0", not "0E-7"
        OsmBoundingBox box = OsmBoundingBox.ofDegrees(-1.5, -180, 0, 106);
        assertThat(box.format()).isEqualTo("-1.5,-180,0,106");
    }

    @Test
    void equalDegreesGiveEqualBoxesDespiteDoubleRounding() {
        // Design decision: E7 integers, so 0.1 + 0.2 (= 0.30000000000000004) and 0.3 are the same edge
        assertThat(OsmBoundingBox.ofDegrees(0.1 + 0.2, 106, 1, 107))
                .isEqualTo(OsmBoundingBox.ofDegrees(0.3, 106, 1, 107));
    }

    @Test
    void ofDegreesRejectsSwappedLatitudeAndLongitude() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmBoundingBox.ofDegrees(106.64822, 10.99156, 106.72784, 11.11790))
                .withMessageContaining("south latitude out of range");
    }

    @Test
    void ofDegreesRejectsNaN() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmBoundingBox.ofDegrees(Double.NaN, 106, 11, 107))
                .withMessageContaining("must be finite");
    }

    //Degenerate boxes 

    @ParameterizedTest
    @CsvSource({"300, 300", "301, 300"})
    void southMustBeLessThanNorth(int south, int north) {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmBoundingBox(south, 200, north, 400))
                .withMessageContaining("south must be less than north");
    }

    @ParameterizedTest
    @CsvSource({"400, 400", "401, 400"})
    void westMustBeLessThanEast(int west, int east) {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmBoundingBox(100, west, 300, east))
                .withMessageContaining("west must be less than east");
    }

    // Range 
    @Test
    void acceptsWholeWorld() {
        OsmBoundingBox world = new OsmBoundingBox(
                -OsmNode.MAX_LAT_E7, -OsmNode.MAX_LON_E7, OsmNode.MAX_LAT_E7, OsmNode.MAX_LON_E7);
        assertThat(world.contains(0, 0)).isTrue();
    }

    @Test
    void rejectsEachEdgeOutOfRange() {
        int lat = OsmNode.MAX_LAT_E7;
        int lon = OsmNode.MAX_LON_E7;
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmBoundingBox(-lat - 1, 0, 100, 100))
                .withMessageContaining("south latitude out of range");
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmBoundingBox(0, 0, lat + 1, 100))
                .withMessageContaining("north latitude out of range");
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmBoundingBox(0, -lon - 1, 100, 100))
                .withMessageContaining("west longitude out of range");
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmBoundingBox(0, 0, 100, lon + 1))
                .withMessageContaining("east longitude out of range");
    }
}