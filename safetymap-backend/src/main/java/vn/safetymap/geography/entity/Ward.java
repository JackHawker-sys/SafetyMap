package vn.safetymap.geography.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.MultiPolygon;

import java.time.Instant;

@Entity
@Table(name = "wards")
@Getter
@Setter
@NoArgsConstructor
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Integer id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private WardType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "province_id", nullable = false)
    private Province province;

     // Column "boundary" (MultiPolygon, 4326) exists in the DB but is intentionally NOT mapped:
    // it holds large polygons that every list query would load and discard.
    // Spatial work runs in SQL (ST_Contains); expose shapes via a dedicated GeoJSON query when needed.
    /* @Column(columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon boundary; */

    @Column(name = "created_at", insertable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private Instant createdAt;

}
