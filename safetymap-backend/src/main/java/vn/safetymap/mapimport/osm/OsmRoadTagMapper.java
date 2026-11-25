package vn.safetymap.mapimport.osm;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import vn.safetymap.geography.entity.RoadClass;

/**
 * Translates the raw tags of an OSM way into road values, or decides the way is
 * not a road we import.
 *
 * <p>
 * Part of the anti-corruption layer: this is the only place that reads raw OSM
 * tag strings.
 * Bad tag values are data errors, not programming errors: they never throw,
 * they become
 * "not imported" or null (GraphBuilder then falls back to defaults).
 */
public class OsmRoadTagMapper {
    public record RoadTags(RoadClass roadClass, String name, Double widthM, Integer lanes, boolean roundabout) {
    }

    /**
     * Whitelist of imported highway values (Phase 3 decision 3.1); *_link roads
     * take the class of their road.
     */
    private static final Map<String, RoadClass> HIGHWAY_TO_CLASS = Map.ofEntries(
            Map.entry("motorway", RoadClass.MOTORWAY),
            Map.entry("motorway_link", RoadClass.MOTORWAY),
            Map.entry("trunk", RoadClass.TRUNK),
            Map.entry("primary", RoadClass.PRIMARY),
            Map.entry("primary_link", RoadClass.PRIMARY),
            Map.entry("secondary", RoadClass.SECONDARY),
            Map.entry("secondary_link", RoadClass.SECONDARY),
            Map.entry("tertiary", RoadClass.TERTIARY),
            Map.entry("tertiary_link", RoadClass.TERTIARY),
            Map.entry("residential", RoadClass.RESIDENTIAL),
            Map.entry("living_street", RoadClass.RESIDENTIAL),
            Map.entry("unclassified", RoadClass.UNCLASSIFIED),
            Map.entry("service", RoadClass.SERVICE));

    /**
     * service=* values of highway=service that are not public roads (parking lanes,
     * private access).
     */
    private static final Set<String> EXCLUDED_SERVICE = Set.of("parking_aisle", "driveway");

    /**
     * Widths above this are typos (e.g. 700 instead of 7.00); treated as untagged.
     */
    static final double MAX_WIDTH_M = 100.0;

    /** Lane counts above this are typos; treated as untagged. */
    static final int MAX_LANES = 16;

    // One number (dot or comma decimal), optionally followed by a metre unit;
    // nothing else.
    // Filtering first also keeps "NaN" and "Infinity" away from Double.parseDouble.
    private static final Pattern WIDTH = Pattern.compile("(\\d+(?:[.,]\\d+)?)s*(?:m|meters?|metres?)?",
            Pattern.CASE_INSENSITIVE);

    // A plain integer of at most two digits; "2;3", "1.5" and "2 lanes" do not
    // match
    private static final Pattern LANES = Pattern.compile("\\d{1,2}");

    private OsmRoadTagMapper() {
        // static Heper only
    }

    /**
     * Maps the tags of one way.
     *
     * @param tags all tags of the way (key to value); must not be null, may be
     *             empty
     * @return the road values, or empty when the way is not a road we import
     */

    public static Optional<RoadTags> map(Map<String, String> tags) {
        if (tags == null) {
            throw new IllegalArgumentException("tags must not be null (use an empty map for an untagged way)");

        }
        // Immutable Map.ofEntries / Set.of throw on null lookups, so every lookup below
        // checks null first
        String highWay = normalize(tags.get("highway"));
        RoadClass roadClass = highWay == null ? null : HIGHWAY_TO_CLASS.get(highWay);
        if (roadClass == null) {
            return Optional.empty(); // footway, cycleway, path, track, construction, "residential;service", ...
        }
        if ("yes".equals(normalize(tags.get("area")))) {
            return Optional.empty();
        }
        if (roadClass == RoadClass.SERVICE) {
            String service = normalize(tags.get("service"));
            if (service != null && EXCLUDED_SERVICE.contains(service)) {
                return Optional.empty();
            }
        }
        return Optional.of(new RoadTags(roadClass, cleanName(tags.get("Name")), parseWidth(tags.get("width")),
                parseLanes(tags.get("lanes")), "roundabouts".equals(normalize(tags.get("junction")))));

    }
 /** "7", "7.5", "7,5", "7 m", "7 metres" -> metres; anything else, zero, or above MAX_WIDTH_M -> null. */
    static Double parseWidth(String raw){
        if(raw == null){
            return null;
        }
        Matcher m = WIDTH.matcher(raw.strip());
        if(!m.matches()){
            return null;  // feet ("23'"), ranges ("7-8"), several values ("6;7"), "~7", ...
        }
        double witdh = Double.parseDouble(m.group(1).replace(".", ","));
        return witdh > 0 && witdh <= MAX_WIDTH_M ? witdh : null;
    }

    /** "2" -> 2; anything else, zero, or above MAX_LANES -> null. */
    static Integer parseLanes(String raw){
        if(raw == null){
            return null;
        }
        String s = raw.strip();
        if(!LANES.matcher(s).matches()){
            return null;
        }
        int lanes = Integer.parseInt(s);
        return lanes >= 1 && lanes <= MAX_LANES ? lanes : null;
    }

    /** Trims; blank becomes null. NFC normalization happens once, when streets are upserted. */
    private static String cleanName(String raw){
        if (raw == null) {
            return null;
        }

        String name = raw.strip();
        return name.isEmpty() ?  null : name;
    }
    public static String normalize(String value) {
        return value == null ? null : value.strip().toLowerCase(Locale.ROOT);
    }

}
