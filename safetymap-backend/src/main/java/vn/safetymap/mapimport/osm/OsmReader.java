package vn.safetymap.mapimport.osm;

import java.io.IOException;
import java.nio.file.Path;
@FunctionalInterface 
public interface OsmReader {
    /**
     * @param file local OSM file; never fetched over the network
     * @param bbox area to keep
     * @return the roads of the area, ways sorted by id
     * @throws IOException if the file cannot be read, is corrupt, or has no data timestamp in its header
     */
    OsmData read(Path file, OsmBoundingBox bbox) throws IOException;
}
