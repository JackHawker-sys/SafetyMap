package vn.safetymap.geography.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity 
@Table(name = "streets")
@Getter 
@Setter 
@NoArgsConstructor 

public class Street {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn (name = "provinceiD", nullable = false)
    private Province province;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_street_id")
    private Street parentStreet;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "street_type", nullable = false, length = 20)
    private StreetType streetType = StreetType.ROAD;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
