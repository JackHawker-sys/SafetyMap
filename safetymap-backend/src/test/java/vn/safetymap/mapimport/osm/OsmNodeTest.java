package vn.safetymap.mapimport.osm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.locationtech.jts.geom.Coordinate;

class OsmNodeTest {

    private static final long ID = 42L;

    // degrees <-> E7

    @Test
    void ofDegreesRoundsToNearestE7Unit() {
        // 10.99161 * 1e7 is not exact in binary floating point (may be 109916099.99999...);
        // rounding must still give the intended integer
        OsmNode node = OsmNode.ofDegrees(ID, 10.99161, 106.66638);

        assertThat(node.latE7()).isEqualTo(109_916_100);
        assertThat(node.lonE7()).isEqualTo(1_066_663_800);
    }

    @Test
    void degreesAccessorsReverseE7() {
        OsmNode node = new OsmNode(ID, 110_524_100, 1_066_663_800);

        assertThat(node.lat()).isEqualTo(11.05241);
        assertThat(node.lon()).isEqualTo(106.66638);
    }

    @Test
    void samePositionGivesEqualNodes() {
        // Design decision: integer storage makes equality exact, unlike comparing doubles
        OsmNode fromDegrees = OsmNode.ofDegrees(ID, 11.05241, 106.66638);
        OsmNode fromPacked = OsmNode.unpack(ID, fromDegrees.packed());

        assertThat(fromPacked).isEqualTo(fromDegrees);
    }

    @ParameterizedTest
    @ValueSource(doubles = {Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY})
    void toE7RejectsNonFiniteDegrees(double degrees) {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmNode.toE7(degrees))
                .withMessageContaining("finite");
    }

    @Test
    void toE7ThrowsOnIntOverflowInsteadOfWrapping() {
        // Design decision: 300 degrees -> 3e9 does not fit in an int; fail loudly, never wrap to a negative value
        assertThatThrownBy(() -> OsmNode.toE7(300.0)).isInstanceOf(ArithmeticException.class);
    }

    //pack / unpack 
    @ParameterizedTest(name = "lat={0}, lon={1}")
    @CsvSource({
            "109916100,  1066663800",   // Binh Duong (both positive)
            "-337000000, -705000000",   // both negative (southern + western hemisphere)
            "1,          -1",           // negative lon must not overwrite lat
            "-1,         1",
            "0,          0",
            "900000000,  1800000000",   // maximum values
            "-900000000, -1800000000"   // minimum values
    })
    void packThenUnpackReturnsSamePosition(int latE7, int lonE7) {
        long packed = OsmNode.pack(latE7, lonE7);
        OsmNode node = OsmNode.unpack(ID, packed);

        assertThat(node.latE7()).isEqualTo(latE7);
        assertThat(node.lonE7()).isEqualTo(lonE7);
        assertThat(node.id()).isEqualTo(ID);
    }

    @Test
    void packedMatchesStaticPack() {
        OsmNode node = new OsmNode(ID, 110_524_100, 1_066_663_800);

        assertThat(node.packed()).isEqualTo(OsmNode.pack(110_524_100, 1_066_663_800));
    }

    //  JTS
    @Test
    void toCoordinatePutsLongitudeInXAndLatitudeInY() {
        Coordinate c = OsmNode.ofDegrees(ID, 11.05241, 106.66638).toCoordinate();

        assertThat(c.getX()).as("x = longitude").isEqualTo(106.66638);
        assertThat(c.getY()).as("y = latitude").isEqualTo(11.05241);
    }

    // validation (one wrong input per case)

    @ParameterizedTest
    @ValueSource(longs = {0L, -1L, Long.MIN_VALUE})
    void rejectsNonPositiveId(long id) {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmNode(id, 0, 0))
                .withMessageContaining("id must be positive");
    }

    @ParameterizedTest
    @ValueSource(ints = {OsmNode.MAX_LAT_E7 + 1, -OsmNode.MAX_LAT_E7 - 1, Integer.MAX_VALUE, Integer.MIN_VALUE})
    void rejectsLatitudeOutOfRange(int latE7) {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmNode(ID, latE7, 0))
                .withMessageContaining("Latitude out of range");
    }

    @ParameterizedTest
    @ValueSource(ints = {OsmNode.MAX_LON_E7 + 1, -OsmNode.MAX_LON_E7 - 1, Integer.MAX_VALUE, Integer.MIN_VALUE})
    void rejectsLongitudeOutOfRange(int lonE7) {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new OsmNode(ID, 0, lonE7))
                .withMessageContaining("Longitude out of range");
    }

    @Test
    void unpackValidatesThroughConstructor() {
        // A packed value whose high half is out of latitude range must not slip through
        long corrupt = OsmNode.pack(Integer.MAX_VALUE, 0);

        assertThatIllegalArgumentException()
                .isThrownBy(() -> OsmNode.unpack(ID, corrupt))
                .withMessageContaining("Latitude out of range");
    }
}