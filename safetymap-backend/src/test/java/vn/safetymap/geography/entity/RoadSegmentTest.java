package vn.safetymap.geography.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.PrecisionModel;
import vn.safetymap.common.config.GeometryConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class RoadSegmentTest {

        // Same configuration as the GeometryFactory bean (no Spring context in a unit
        // test).
        private static final GeometryFactory GF = GeometryConfig.wgs84Factory();

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
                return RoadSegment.create(street, null, 100L, order, 1L, 2L, roadClass, shape, lengthM);
        }

        //Valid cases

        @Test
        void createsValidSegment() {
                RoadSegment s = create(new Street(), 0, RoadClass.PRIMARY, line(GF), 230.0);

                assertThat(s.getOsmWayId()).isEqualTo(100L);
                assertThat(s.getSegmentOrder()).isZero();
                assertThat(s.getRoadClass()).isEqualTo(RoadClass.PRIMARY);
                assertThat(s.getLengthM()).isEqualTo(230.0);
                assertThat(s.getWard()).isNull();
                // Generated columns are computed by the database, never in Java.
                assertThat(s.getStartLatitude()).isNull();
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
                                RoadClass.TERTIARY, loop, 300.0);

                assertThat(s.getStartNodeId()).isEqualTo(s.getEndNodeId());
        }

        //Missing required values

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
                                                RoadClass.PRIMARY, line(GF), 230.0))
                                .withMessageContaining("osmWayId");
        }

        @Test
        void rejectsMissingRoadClass() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), 0, null, line(GF), 230.0))
                                .withMessageContaining("roadClass");
        }

        //Invalid values

        @Test
        void rejectsNegativeOrder() {
                assertThatIllegalStateException()
                                .isThrownBy(() -> create(new Street(), -1, RoadClass.PRIMARY, line(GF), 230.0))
                                .withMessageContaining("segmentOrder");
        }

        // NaN and Infinity matter: a database CHECK (length_m > 0) would accept them.
        @ParameterizedTest
        @ValueSource(doubles = { 0.0, -5.0, Double.NaN, Double.POSITIVE_INFINITY })
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

        //Invalid shapes

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
