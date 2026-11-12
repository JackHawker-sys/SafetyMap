package vn.safetymap.geography.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import vn.safetymap.common.config.GeometryConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.time.Instant;

class BlockTest {
    private static final GeometryFactory GF = GeometryConfig.wgs84Factory();

    private static LinearRing squareRing(GeometryFactory gf, double minX, double minY, double size) {
        return gf.createLinearRing(new Coordinate[] {
                new Coordinate(minX, minY),
                new Coordinate(minX + size, minY),
                new Coordinate(minX + size, minY + size),
                new Coordinate(minX, minY + size),
                new Coordinate(minX, minY)
        });
    }

    private static Polygon square(GeometryFactory gf) {
        return gf.createPolygon(squareRing(gf, 100.600, 10.776, 0.002));
    }

    private static final MapImport IMPORT = MapImport.start("TestArea", "unit-test", Instant.EPOCH, square(GF));

    // Valid Cases:

    @Test
    void createsValidBlock() {
        Block b = Block.create(IMPORT, square(GF), 48000.0);

        assertThat(b.getMapImport()).isSameAs(IMPORT);
        assertThat(b.getAreaM2()).isEqualTo(48000.0);
        assertThat(b.getWard()).isNull();
    }

    @Test
    void allowPolygonWithHole() {
        LinearRing outer = squareRing(GF, 106.700, 10.776, 0.004);
        LinearRing inner = squareRing(GF, 106.701, 10.777, 0.001);
        Polygon withHole = GF.createPolygon(outer, new LinearRing[] { inner });

        Block b = Block.create(IMPORT, withHole, 180_000.0);

        assertThat(b.getShape().getNumInteriorRing()).isEqualTo(1);
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
    @ValueSource(doubles = { 0.0, -1.0, Double.NaN, Double.POSITIVE_INFINITY })
    void rejectsInvalidArea(double area) {
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, square(GF), area))
                .withMessageContaining("areaM2");
    }

    @Test
    void rejectsNullArea() {
        assertThatIllegalStateException()
                .isThrownBy(() -> Block.create(IMPORT, square(GF), null))
                .withMessageContaining("areaM2");
    }
}
