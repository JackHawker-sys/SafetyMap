package vn.safetymap.geography.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

import vn.safetymap.common.config.GeometryConfig;

 class MapImportTest {
    private static final GeometryFactory GF = GeometryConfig.wgs84Factory();
    private static final Instant DATA_AT = Instant.parse("2026-11-11T00:00:00Z");

    private static Polygon area(GeometryFactory factory){
        return factory.createPolygon(new Coordinate[] {
            new Coordinate(106.64822, 10.99156),
            new Coordinate(106.72784, 10.99156),
            new Coordinate(106.72784, 11.11790),
            new Coordinate(106.64822, 11.11790),
            new Coordinate(106.64822, 10.99156)
        });
    }

    private static MapImport start(String areaName, String sourceName){
        return MapImport.start(areaName, sourceName,DATA_AT,area(GF));
    }

    // Happy Paths

    @Test 
    void startWithZeroCounts(){
        MapImport mi = start("Binh Duong ward", "test");
        assertThat(mi.getSegmentCount()).isZero();
        assertThat(mi.getBlockCount()).isZero();
        assertThat(mi.getJunctionCount()).isZero();
        assertThat(mi.getOsmDataAt()).isEqualTo(DATA_AT);
        
        //Written by the database default, never in java
        assertThat(mi.getImportedAt()).isNull();
    }

    @Test 
    void stripsSpaceAroundNames(){
        MapImport mi = start("Binh Duong ward", "geofabrik");

        assertThat(mi.getAreaName()).isEqualTo("Binh Duong ward");
        assertThat(mi.getSourceName()).isEqualTo("geofabrik");
    }

    @Test 
    void realisticSourceNameFitsTheColumn(){
        // The planned source_name (file, padded bbox, sha256) must fit VARCHAR(200)
        String source = "geofabrik|vietnam-2026-11-11.osm.pbf|bbox=10.99156,106.64822,11.11790,106.72784"
                + "|sha256=5eb2bce83b0e93d43119de637311066ecc8815e045539514cc528a686731c7a8";
        assertThat(source.length()).isLessThanOrEqualTo(200);
        assertThat(start("Binh Duong ward", source).getSourceName()).isEqualTo(source);      
    }

    @Test
    void recordResultSetsAllThreeCounts(){
        MapImport mi = start("Binh Duong ward", "test");
        mi.recordResult(4200, 1300, 25);

        assertThat(mi.getSegmentCount()).isEqualTo(4200);
        assertThat(mi.getBlockCount()).isEqualTo(1300);
        assertThat(mi.getJunctionCount()).isEqualTo(25);
    }

    @Test
    void recordResultAcceptsZero() {
        // An area with no roads is unusual but not an error
        MapImport mi = start("Empty area", "test");

        mi.recordResult(0, 0, 0);

        assertThat(mi.getJunctionCount()).isZero();
    }

    // recordResult: One negative count per case

    @ParameterizedTest (name = "segments={0}, blocks = {1}, junction = {2}")
    @CsvSource ({
        "-1 , 0 , 0",
        "0, -1, 0",
        "0, 0, -1"
    })
    void recordResultRejectsNegativeCount(int segments, int block, int junction){
        MapImport mi = start("Binh Duong ward", "test");

        assertThatIllegalArgumentException()
                .isThrownBy(() -> mi.recordResult(segments, block, junction))
                .withMessageContaining("count must be 0 or more");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void rejectsMissingAreaName(String areaName) {
        assertThatIllegalStateException()
                .isThrownBy(() -> start(areaName, "test"))
                .withMessageContaining("areaName is required");
    }

    @Test
    void acceptsAreaNameOfExactlyTheColumnLength() {
        assertThat(start("a".repeat(150), "test").getAreaName()).hasSize(150);
    }

    @Test
    void rejectsAreaNameLongerThanTheColumn() {
        assertThatIllegalStateException()
                .isThrownBy(() -> start("a".repeat(151), "test"))
                .withMessageContaining("areaName longer than");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void rejectsMissingSourceName(String sourceName) {
        assertThatIllegalStateException()
                .isThrownBy(() -> start("Binh Duong ward", sourceName))
                .withMessageContaining("sourceName is required");
    }

    @Test
    void acceptsSourceNameOfExactlyTheColumnLength() {
        assertThat(start("Binh Duong ward", "s".repeat(200)).getSourceName()).hasSize(200);
    }

    @Test
    void rejectsSourceNameLongerThanTheColumn() {
        assertThatIllegalStateException()
                .isThrownBy(() -> start("Binh Duong ward", "s".repeat(201)))
                .withMessageContaining("sourceName longer than");
    }

    @Test
    void rejectsMissingDataDate() {
        assertThatIllegalStateException()
                .isThrownBy(() -> MapImport.start("Binh Duong ward", "test", null, area(GF)))
                .withMessageContaining("osmDataAt is required");
    }

    @Test
    void rejectsMissingAreaShape() {
        assertThatIllegalStateException()
                .isThrownBy(() -> MapImport.start("Binh Duong ward", "test", DATA_AT, null))
                .withMessageContaining("area shape is required");
    }


    @Test
    void rejectsEmptyAreaShape() {
        // An empty polygon is "valid" for JTS, so emptiness must be checked on its own
        assertThatIllegalStateException()
                .isThrownBy(() -> MapImport.start("Binh Duong ward", "test", DATA_AT, GF.createPolygon()))
                .withMessageContaining("area shape is required");
    } 

    @Test
    void rejectsAreaShapeWithWrongSrid() {
        GeometryFactory webMercator = new GeometryFactory(new PrecisionModel(), 3857);

        assertThatIllegalStateException()
                .isThrownBy(() -> MapImport.start("Binh Duong ward", "test", DATA_AT, area(webMercator)))
                .withMessageContaining("SRID 4326");
    }

    @Test
    void rejectsSelfIntersectingAreaShape() {
        Polygon bowTie = GF.createPolygon(new Coordinate[] {
                new Coordinate(106.65, 10.99),
                new Coordinate(106.72, 11.11),
                new Coordinate(106.72, 10.99),
                new Coordinate(106.65, 11.11),
                new Coordinate(106.65, 10.99)
        });

        assertThatIllegalStateException()
                .isThrownBy(() -> MapImport.start("Binh Duong ward", "test", DATA_AT, bowTie))
                .withMessageContaining("not a valid polygon");
    }
}
