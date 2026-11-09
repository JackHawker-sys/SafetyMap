package vn.safetymap.geography.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;


@Entity
@Table(name = "block_segments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlockSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "block_id", nullable = false, updatable = false)
    private Block block;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "segment_id", nullable = false, updatable = false)
    private RoadSegment segment;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;


    
    public static BlockSegment link(Block block, RoadSegment segment) {
        BlockSegment bs = new BlockSegment();
        bs.block = block;
        bs.segment = segment;
        bs.checkInvariants();
        return bs;
    }



    @PrePersist
    void checkInvariants() {
        if (block == null) {
            throw new IllegalStateException("block is required");
        }
        if (segment == null) {
            throw new IllegalStateException("segment is required");
        }
    }
}