package vn.safetymap.geography.entity;

import org.junit.jupiter.api.Test; // @Test marks a method as a single test case that JUnit runs
import org.junit.jupiter.params.ParameterizedTest; // @ParameterizedTest runs one test method several times with different inputs.
import org.junit.jupiter.params.provider.ValueSource; // @ValueSource supplies those inputs as a simple array
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString; // A line through 2 or more points, like a route or a road segment.
import org.locationtech.jts.geom.PrecisionModel;
import vn.safetymap.common.config.GeometryConfig;
import org.locationtech.jts.geom.Polygon;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class RoadSegmentTest {

        // Same configuration as the GeometryFactory bean (no Spring context in a unit
        // test).
        private static final GeometryFactory GF = GeometryConfig.wgs84Factory();
        // Valid default width; distinct from every length used below, so a swapped
        // argument is caught.
        private static final double WIDTH_M = 7.0;

        // Coordinate(x = longitude, y = latitude); points near Ben Thanh, HCMC.
        private static LineString line(GeometryFactory gf) {
                return gf.createLineString(new Coordinate[] {
                                new Coordinate(106.700, 10.776),
                                new Coordinate(106.702, 10.777)
                });
        }

        // Valid defaults for everything except the arguments a test wants to vary.
        private static RoadSegment create(Street street, Integer order, RoadClass roadClass,
                        LineString shape, Double lengthM) {
                return RoadSegment.create(street, null, 100L, order, 1L, 2L, roadClass, shape, lengthM, WIDTH_M);
        }

        private static RoadSegment createWithWidth(Double widthM) {
                return RoadSegment.create(new Street(), null, 100L, 0, 1L, 2L, RoadClass.PRIMARY, line(GF), 230.0,
                                widthM);
        }

        // A small valid polygon near Ben Thanh, for the map import and junction needed
        // by a few tests.
        private static Polygon square() {
                return GF.createPolygon(new Coordinate[] {
                                new Coordinate(106.700, 10.776),
                                new Coordinate(106.701, 10.776),
                                new Coordinate(106.701, 10.777),
                                new Coordinate(106.700, 10.777),
                                new Coordinate(106.700, 10.776)
                });
        }
        // Valid cases

        @Test
        void createsValidSegment() {
                RoadSegment s = create(new Street(), 0, RoadClass.PRIMARY, line(GF), 230.0);

                assertThat(s.getOsmWayId()).isEqualTo(100L);
                assertThat(s.getSegmentOrder()).isZero();
                assertThat(s.getRoadClass()).isEqualTo(RoadClass.PRIMARY);
                assertThat(s.getLengthM()).isEqualTo(230.0);
                assertThat(s.getWard()).isNull();
                assertThat(s.getWidthM()).isEqualTo(WIDTH_M);
                assertThat(s.getJunction()).isNull();
                // Generated columns are computed by the database, never in Java.
                assertThat(s.getStartLatitude()).isNull();
        }

        @Test
        void lengthAndWidthGoToTheirOwnFields() {
                // Both are Double, so the compiler cannot catch them being swapped in
                // create(...)
                RoadSegment s = RoadSegment.create(new Street(), null, 100L, 0, 1L, 2L,
                                RoadClass.PRIMARY, line(GF), 230.0, 12.5);

                assertThat(s.getLengthM()).isEqualTo(230.0);
                assertThat(s.getWidthM()).isEqualTo(12.5);
        }

        @Test
        void junctionCanBeAssignedAndCleared() {
                // Design decision: null is legal, because a re-import recomputes this link
                RoadSegment s = create(new Street(), 0, RoadClass.PRIMARY, line(GF), 230.0);
                Junction junction = Junction.cluster(
                                MapImport.start("test", "test", Instant.parse("2026-11-12T00:00:00Z"), square()),
                                null, new long[] { 1 }, square());

                s.assignJunction(junction);
                assertThat(s.getJunction()).isSameAs(junction);

                s.assignJunction(null);
                assertThat(s.getJunction()).isNull();
        }

        @Test
        void allowsSameStartAndEndNode() {
                // A closed roundabout starts and ends at the same OSM node.
                LineString loop = GF.createLineString(new Coordinate[] {
                                new Coordinate(106.700, 10.776),
                                new Coordinate(106.701, 10.777),
                                new Coordinate(106.702, 10.776),
                                new Coordinate(106.700, 10.776)
                });
                RoadSegment s = RoadSegment.create(new Street(), null, 100L, 0, 7L, 7L,
                                RoadClass.TERTIARY, loop, 300.0, WIDTH_M);

                assertThat(s.getStartNodeId()).isEqualTo(s.getEndNodeId());
        }

        // Missing required values

        @Test
        void rejectsMissingStreet() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(null, 0, RoadClass.PRIMARY, line(GF), 230.0))
                                .withMessageContaining("street");
        }

        @Test
        void rejectsMissingOsmIds() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> RoadSegment.create(new Street(), null, null, 0, 1L, 2L,
                                                RoadClass.PRIMARY, line(GF), 230.0, WIDTH_M))
                                .withMessageContaining("osmWayId");
        }

        @Test
        void rejectsMissingRoadClass() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, null, line(GF), 230.0))
                                .withMessageContaining("roadClass");
        }

        // Invalid values

        @Test
        void rejectsNegativeOrder() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), -1, RoadClass.PRIMARY, line(GF), 230.0))
                                .withMessageContaining("segmentOrder");
        }

        // NaN and Infinity matter: a database CHECK (length_m > 0) would accept them.
        @ParameterizedTest
        @ValueSource(doubles = { 0.0, -5.0, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY })
        void rejectsInvalidLength(double length) {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, RoadClass.PRIMARY, line(GF), length))
                                .withMessageContaining("lengthM");
        }

        @Test
        void rejectsNullLength() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, RoadClass.PRIMARY, line(GF), null))
                                .withMessageContaining("lengthM");
        }

        // Same rule as length: a database CHECK (width_m > 0) alone would accept NaN.
        @ParameterizedTest
        @ValueSource(doubles = { 0.0, -3.5, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY })
        void rejectsInvalidWidth(double width) {
                assertThatIllegalStateException()
                                .isThrownBy(() -> createWithWidth(width))
                                .withMessageContaining("widthM");
        }

        @Test
        void rejectsNullWidth() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> createWithWidth(null))
                                .withMessageContaining("widthM");
        }
        // Invalid shapes

        @Test
        void rejectsEmptyShape() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, RoadClass.PRIMARY, GF.createLineString(),
                                                230.0))
                                .withMessageContaining("road shape is required");
        }

        @Test
        void rejectsWrongSrid() {
                GeometryFactory webMercator = new GeometryFactory(new PrecisionModel(), 3857);
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, RoadClass.PRIMARY, line(webMercator), 230.0))
                                .withMessageContaining("SRID");
        }

        @Test
        void rejectsDegenerateShape() {
                // Two identical points: a zero-length line.
                LineString degenerate = GF.createLineString(new Coordinate[] {
                                new Coordinate(106.700, 10.776),
                                new Coordinate(106.700, 10.776)
                });
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, RoadClass.PRIMARY, degenerate, 230.0))
                                .withMessageContaining("not a valid line");
        }
}
