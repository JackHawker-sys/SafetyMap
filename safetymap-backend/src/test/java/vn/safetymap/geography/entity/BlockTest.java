package vn.safetymap.geography.entity;



import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import vn.safetymap.common.config.GeometryConfig;


import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import java.time.Instant;

class BlockTest {
    private static final GeometryFactory GF = GeometryConfig.wgs84Factory();

    private static LinearRing squareRing(GeometryFactory gf, double minX, double minY, double size) {
        return gf.createLinearRing(new Coordinate[]{
            new Coordinate (minX, minY),
            new Coordinate (minX + size, minY),
            new Coordinate (minX + size, minY + size),
            new Coordinate (minX, minY + size),
            new Coordinate (minX, minY)
        });
    }

    private static Polygon square(GeometryFactory gf){
        return gf.createPolygon(squareRing(gf, 106.700, 10.776, 0.002));
    }
    
    private static final MapImport IMPORT = MapImport.start("TestArea", "unit-test",  Instant.EPOCH, square(GF));
    private static Junction junction(){
        return Junction.cluster(IMPORT, null, new long[]{1}, square(GF));
    }

    // Valid Cases:

    @Test 
    void createsValidBlock(){
        Block b = Block.create(IMPORT, square(GF), 48000.0);

        assertThat(b.getMapImport()).isSameAs(IMPORT);
        assertThat(b.getAreaM2()).isEqualTo(48000.0);
        assertThat(b.getWard()).isNull();
        assertThat(b.getJunction()).isNull();
        assertThat(b.isIsland()).isFalse();
    }

    @Test 
    void allowPolygonWithHole(){
        LinearRing outer = squareRing(GF, 106.700, 10.776, 0.004);
        LinearRing inner = squareRing(GF, 106.701, 10.777, 0.001);
        Polygon withHole = GF.createPolygon(outer, new LinearRing[]{inner});

        Block b = Block.create(IMPORT, withHole, 180_000.0);

        assertThat(b.getShape().getNumInteriorRing()).isEqualTo(1);
    }
    
    @Test
    void markAsIslandLinksTheJunction() {
        Block b = Block.create(IMPORT, square(GF), 48_000.0);
        Junction j = junction();

        b.markAsIsland(j);

        assertThat(b.getJunction()).isSameAs(j);
        assertThat(b.isIsland()).isTrue();
    }

    @Test
    void markAsIslandRejectsNull() {
        // Design decision: an island is never cleared, blocks are rebuilt on re-import
        Block b = Block.create(IMPORT, square(GF), 48_000.0);

        assertThatIllegalArgumentException()
                .isThrownBy(() -> b.markAsIsland(null))
                .withMessageContaining("junction is required");
    }

    // Missing or invalid values 

    @Test
    void rejectsMissingMapImport() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(null, square(GF), 48_000.0))
                .withMessageContaining("mapImport");
    }

    // NaN and Infinity matter: a database CHECK (area_m2 > 0) would accept them.
    @ParameterizedTest
    @ValueSource(doubles = {0.0, -1.0, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY})
    void rejectsInvalidArea(double area) {
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, square(GF), area))
                .withMessageContaining("areaM2");
    }

    // Invalid Shapes
    
    @Test
    void rejectsNullArea() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, square(GF), null))
                .withMessageContaining("areaM2");
    }

    @Test
    void rejectsEmptyShape() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, GF.createPolygon(), 48_000.0))
                .withMessageContaining("block shape is required");
    }

    @Test
    void rejectsWrongSrid() {
        GeometryFactory webMercator = new GeometryFactory(new PrecisionModel(), 3857);
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, square(webMercator), 48_000.0))
                .withMessageContaining("SRID");
    }

    @Test
    void rejectsSelfIntersectingShape() {
        //the outline crosses itself, so the polygon is invalid.
        Polygon bowTie = GF.createPolygon(new Coordinate[]{
                new Coordinate(106.700, 10.776),
                new Coordinate(106.702, 10.778),
                new Coordinate(106.702, 10.776),
                new Coordinate(106.700, 10.778),
                new Coordinate(106.700, 10.776)
        });
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, bowTie, 48_000.0))
                .withMessageContaining("not a valid polygon");
    }
}
