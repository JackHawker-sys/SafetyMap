package vn.safetymap.mapimport.osm;

import java.math.BigDecimal;

/**
 * Latitude/longitude box used to select data from an OSM file, in integer degrees x 1e7 like {@link OsmNode}.
 *
 * <p>Edges are inclusive. Boxes crossing the 180th meridian are not supported (west must be less than east).
 */
public record OsmBoundingBox(int southE7, int westE7, int northE7, int eastE7) {
    public OsmBoundingBox {
        checkLat("south", southE7);
        checkLat("north", northE7);
        checkLon("west", westE7);
        checkLon("east", eastE7);
        if (southE7 >= northE7) {
            throw new IllegalArgumentException("south must be less than north: " + southE7 + " >= " + northE7);
        }

        if (westE7 >= eastE7) {
            throw new IllegalArgumentException("west must be less than east: " + westE7 + " >= " + eastE7);
        }
    }

    /**
     * Named order (south, west, north, east) so callers cannot silently swap
     * latitude and longitude.
     */
    public static OsmBoundingBox ofDegrees(double south, double west, double north, double east) {
        return new OsmBoundingBox(OsmNode.toE7(south), OsmNode.toE7(west), OsmNode.toE7(north), OsmNode.toE7(east));
    }

    /** Hot path of the reader's first pass: integer comparisons only. */
    public boolean contains(int latE7, int lonE7) {
        return latE7 >= southE7 && latE7 <= northE7 && lonE7 >= westE7 && lonE7 <= eastE7;
    }

    public boolean contains(OsmNode node) {
        return contains(node.latE7(), node.lonE7());
    }

    /**
     * "south,west,north,east" in exact decimal degrees, e.g.
     * "10.99156,106.64822,11.1179,106.72784" (source_name).
     */
    public String format() {
        return degrees(southE7) + "," + degrees(westE7) + "," + degrees(northE7) + "," + degrees(eastE7);
    }

    private static String degrees(int e7) {
        // Exact: no binary floating point, no rounding; toPlainString avoids "1.06E+2"
        return BigDecimal.valueOf(e7, 7).stripTrailingZeros().toPlainString();
    }

    private static void checkLat(String name, int e7) {
        if (e7 < -OsmNode.MAX_LAT_E7 || e7 > OsmNode.MAX_LAT_E7) {
            throw new IllegalArgumentException(name + " latitude out of range (E7): " + e7);
        }
    }

    private static void checkLon(String name, int e7) {
        if (e7 < -OsmNode.MAX_LON_E7 || e7 > OsmNode.MAX_LON_E7) {
            throw new IllegalArgumentException(name + " longitude out of range (E7): " + e7);
        }
    }
}
