package vn.safetymap.geography.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.MultiPolygon;

import java.time.Instant;

@Entity 
@Table(name="provinces")
@Setter
@Getter 
@NoArgsConstructor 
public class Province {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable= false, unique=true, length=10)
    private String code;

    @Column(nullable= false, unique=true, length=150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column (length=20)
    private ProvinceType type;

    @Column(columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon boundary;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
