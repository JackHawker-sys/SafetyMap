package vn.safetymap.geography.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.MultiPolygon;

import java.time.Instant;

@Entity
@Table(name="wards")
@Getter
@Setter
@NoArgsConstructor
public class Ward {

    @Id
    @GeneratedValue(strategy  = GenerationType.IDENTITY)
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

    @Column(columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon boundary;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

}
