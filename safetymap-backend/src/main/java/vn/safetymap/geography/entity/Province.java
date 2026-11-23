package vn.safetymap.geography.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.Instant;

@Entity
@Table(name = "provinces")
@Setter
@Getter
@NoArgsConstructor
public class Province {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Integer id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProvinceType type;


     // Column "boundary" (MultiPolygon, 4326) exists in the DB but is intentionally NOT mapped:
    // it holds large polygons that every list query would load and discard.
    // Spatial work runs in SQL (ST_Contains); expose shapes via a dedicated GeoJSON query when needed.
    /* @Column(columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon boundary; */

    @Column(name = "created_at", insertable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private Instant createdAt;
}
