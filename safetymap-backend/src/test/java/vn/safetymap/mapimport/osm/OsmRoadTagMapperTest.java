package vn.safetymap.mapimport.osm;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import vn.safetymap.mapimport.osm.OsmRoadTagMapper.RoadTags;
import vn.safetymap.geography.entity.RoadClass;

public class OsmRoadTagMapperTest {
    /** Builds a mutable tag map from key/value pairs; HashMap allows null values, Map.of does not. */
    private static Map<String, String> tags(String... keyValues){
        Map<String, String> map = new HashMap<>();
        for(int i = 0; i< keyValues.length; i+= 2){
            map.put(keyValues[i],keyValues[i+1]);
        }
        return map;
    }

    private static RoadTags mapPresent(Map<String, String> tags){
        Optional<RoadTags> result = OsmRoadTagMapper.map(tags);
        assertThat(result).as("expected an imported road for %s");
        return  result.get();
    }

    @ParameterizedTest
    @CsvSource({
            "motorway, MOTORWAY", "motorway_link, MOTORWAY",
            "trunk, TRUNK", "trunk_link, TRUNK",
            "primary, PRIMARY", "primary_link, PRIMARY",
            "secondary, SECONDARY", "secondary_link, SECONDARY",
            "tertiary, TERTIARY", "tertiary_link, TERTIARY",
            "residential, RESIDENTIAL", "living_street, RESIDENTIAL",
            "unclassified, UNCLASSIFIED", "service, SERVICE"
    })
    void mapsEveryWhitelistHighwayToItsRoadClass(String highWay, RoadClass Expected){
        assertThat(mapPresent(tags("highway","primary")).roadClass()).isEqualTo(RoadClass.PRIMARY);
    }

    @Test
    void comparesHighwayTrimmedAndCaseInsensitive() {
        assertThat(mapPresent(tags("highway", " Primary ")).roadClass()).isEqualTo(RoadClass.PRIMARY);
    }
      @ParameterizedTest
    @ValueSource(strings = {"footway", "cycleway", "path", "track", "construction", "residential;service", "   "})
    void rejectsHighwayValuesOutsideTheWhitelist(String highway) {
        assertThat(OsmRoadTagMapper.map(tags("highway", highway))).isEmpty();
    }

    @Test
    void rejectsWayWithoutHighwayTag() {
        assertThat(OsmRoadTagMapper.map(Map.of())).isEmpty();
        assertThat(OsmRoadTagMapper.map(tags("name", "Đại lộ Bình Dương"))).isEmpty();
        assertThat(OsmRoadTagMapper.map(tags("highway", null))).isEmpty();
    }
}
