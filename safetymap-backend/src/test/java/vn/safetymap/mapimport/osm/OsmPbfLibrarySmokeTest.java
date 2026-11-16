package vn.safetymap.mapimport.osm;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.io.BufferedInputStream;

import org.junit.jupiter.api.Test;

import crosby.binary.BinaryParser;
import crosby.binary.Osmformat;
import crosby.binary.file.BlockInputStream;

public class OsmPbfLibrarySmokeTest {
    private static final String FIXTURE = "/osm/binh-duong-ward.osm.pbf";

    @Test
    void readsFixtureAndDecodesCoordinateInsideHcmcArea() throws IOException {
        CountingParser parser = new CountingParser();

        try (InputStream raw = getClass().getResourceAsStream(FIXTURE)) {
            // Buffered: BlockInputStream issues many small reads for block headers
            assertThat(raw).as("fixture on test classplath: %s", FIXTURE).isNotNull();

            // BlockInputStream drives the loop: it reads each file block, decompresses it,
            // and hands it to our parser. Buffered because it issues many small reads for
            // block headers.
            new BlockInputStream(new BufferedInputStream(raw), parser).process();
        }

        // Printed once so we can record the numbers; the assertions below are the real
        // check
        System.out.printf("PBF fixture: program=%s, replicationTimestamp=%s, nodes=%d, ways=%d, highwayWays=%d,"
                + " lat=[%.5f, %.5f], lon=[%.5f, %.5f]%n",
                parser.writingProgram, parser.replicationTimestamp, parser.nodeCount, parser.wayCount,
                parser.highwayWayCount, parser.minLat, parser.maxLat, parser.minLon, parser.maxLon);

        // The file has a header block and the parser reached the end of the file
        assertThat(parser.headerSeen).as("OSM block parsed").isTrue();
        assertThat(parser.completed).as("Parser reached complete()").isTrue();

        // The fixture actually contains data, including roads
        assertThat(parser.nodeCount).isPositive();
        assertThat(parser.wayCount).isPositive();
        assertThat(parser.highwayWayCount).isPositive();

        // Wrong delta decoding or a missing granularity factor would push coordinates
        // far outside
        // this box. The box is deliberately generous: BBBike may keep whole ways that
        // leave the bbox.
        assertThat(parser.minLat).isGreaterThan(10.5);
        assertThat(parser.maxLat).isLessThan(11.5);
        assertThat(parser.minLon).isGreaterThan(106.3);
        assertThat(parser.maxLon).isLessThan(107.0);

    }

    /**
     * Template Method: BinaryParser owns the reading algorithm and calls these
     * hooks
     * for each kind of block. We only fill in the hooks.
     * 
     * <p>
     * It counts elements and tracks the coordinate range. It keeps no per-element
     * objects,
     * so memory use stays flat no matter how big the file is.
     */

    private static final class CountingParser extends BinaryParser{
        boolean headerSeen;
        boolean completed;
        Instant replicationTimestamp;
        String writingProgram;
        long nodeCount;
        long wayCount;
        long highwayWayCount;

        double minLat = Double.POSITIVE_INFINITY;
        double maxLat = Double.NEGATIVE_INFINITY;
        double minLon = Double.POSITIVE_INFINITY;
        double maxLon = Double.NEGATIVE_INFINITY;

        /** Called once for the OSMHeader block at the start of the file. */
        @Override
        protected void parse(Osmformat.HeaderBlock header){
            headerSeen = true;
            writingProgram = header.getWritingprogram();
            // Optional field (seconds since epoch): Geofabrik sets it, other tools may not.
            // We will use it for map_imports.osm_data_at when present.

            if(header.hasOsmosisReplicationTimestamp()){
                replicationTimestamp = Instant.ofEpochSecond(header.getOsmosisReplicationTimestamp());
            }
        }
        
        /** Called for each block of "dense" nodes, the compact format most tools write. */
        @Override 
        protected void parseDense(Osmformat.DenseNodes dense){
            // Coordinates are delta-encoded: each entry stores the difference from the previous node,
            // so we must keep a running sum. The sum restarts at 0 for every block.

            long lat = 0;
            long lon =0;

            for(int i = 0; i < dense.getIdCount();i++){

                lat+= dense.getLat(i);
                lon+= dense.getLon(i);

                // parseLat/parseLon apply the block's granularity and offset and return degrees
                track(parseLat(lat), parseLon(lon));
            }
        }


        /** Called for plain (non-dense) nodes: rare but legal, and their coordinates are absolute. */
        @Override 
        protected void parseNodes(List<Osmformat.Node> nodes){
            for(Osmformat.Node n : nodes){
                track(parseLat(n.getLat()), parseLon(n.getLon()));
            }
        }

        /** Called for each block of ways. A way is an ordered list of node ids plus tags. */
        @Override
        protected void parseWays(List<Osmformat.Way> ways){
            for(Osmformat.Way w : ways){
                wayCount++;

                // Tag keys are stored as indexes into the block's string table, not as text
                for(int k = 0; k < w.getKeysCount(); k++){
                    
                    // Literal first: safe even if the lookup returned null
                    if("highway".equals(getStringById(w.getKeys(k)))){
                        highwayWayCount++;
                        break; // one highway tag is enough, stop scanning this way's tags
                    
                    }
                }
            }
        }


        /** Relations (turn restrictions, routes, ...) are not needed for the road graph. */
        @Override 
        protected void parseRelations(List<Osmformat.Relation> relations){
            // We don't care about relations for this test, but we must implement the hook.
        }

        /** Called once after the last block. */
        @Override 
        public void complete(){
            completed = true;
        }

        /** Counts one node and widens the min/max box to include it. */
        private void track(double lat, double lon){
            nodeCount++;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
        }
    }
}
