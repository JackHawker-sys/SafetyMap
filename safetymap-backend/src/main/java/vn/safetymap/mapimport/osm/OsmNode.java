package vn.safetymap.mapimport.osm;

import org.locationtech.jts.geom.Coordinate;
/**
 * An Osm node reduced to what the road graph needs: its id and its coordinates.
 * 
 * <p>
 * Coordinates are integer degree x 1e7, which is OSM's native precision.
 * Integers are exact, so two equal possition alawys compare equal ( double may
 * differnt in the last bit), and a lat/lon pair packs into one {@code long} for
 * primitive maps.
 * 
 * <p>
 * Part of anti-corruption layer: code outside {@code mapimport.osm} sees this
 * type, never osmpbf classes.
 */
public record OsmNode(long id, int latE7, int lonE7) {

    /** Scale between degrees and integer degrees x 1e7. */
    private static final double E7 = 1e7;

    /** 90 and 180 degrees in E7 units; both fit in an int (max ~2.147e9). */
    static final int MAX_LAT_E7 = 900_000_000;
    static final int MAX_LON_E7 = 1_800_000_000;

    /** Fail fast on corrupt input instead of building a graph from impossible positions. */
    public OsmNode {
        if(id <=0){
            throw new IllegalArgumentException("Osm id must be positive "+ id);
        }
        if (latE7 < -MAX_LAT_E7 || latE7 > MAX_LAT_E7) {
            throw new IllegalArgumentException("Latitude out of range (E7): " + latE7);
        }
        if (lonE7 < -MAX_LON_E7 || lonE7 > MAX_LON_E7) {
            throw new IllegalArgumentException("Longitude out of range (E7): " + lonE7);
        }
    }
    /** Builds a node from decimal degrees, as returned by the PBF parser. */
    public static OsmNode ofDegrees(long id, double lat, double lon){
        return new OsmNode(id, toE7(lat),toE7(lon));
    }

    /**
     * Packs a position into one long: latitude in the high 32 bits, longitude in the low 32 bits.
     * The mask stops a negative longitude from sign-extending over the latitude bits.
     */

    public static long pack(int latE7, int lonE7){
        return ((long) latE7 <<32 | (lonE7 & 0xFFFF_FFFFL));
    }
    /** Reverse of {@link #pack(int, int)}; validates through the canonical constructor. */
    public static OsmNode unpack(long id, long packed){
        return new OsmNode(id, (int) (packed >> 32), (int) packed);
    }

    /** This node's position packed into one long. */
    public long packed(){
        return pack(latE7 , lonE7);
    }

    /** Latitude in decimal degrees. */
    public double lat(){
        return latE7/E7;
    }

    /** Longitude in decimal degrees. */
    public double lon(){
        return lonE7/E7;
    }

    /** JTS coordinate. The single place where (lat, lon) becomes (x = lon, y = lat). */
    public Coordinate toCoordinate() {
        return new Coordinate(lon(), lat());
    }

    /** Degrees -> E7, rounding to the nearest unit; overflow throws instead of wrapping around. */
static int toE7(double degrees) {
    if (!Double.isFinite(degrees)) {
        throw new IllegalArgumentException("Coordinate must be finite: " + degrees);
    }
    return Math.toIntExact(Math.round(degrees * E7));
}
}
