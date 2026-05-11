package com.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "alertes")
public class Alerte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String symptome;

    @Column(nullable = false)
    private String ville;

    @Column(nullable = false)
    private String quartier;

    @Column(nullable = false)
    private Integer nombrePatients;

    @Column(nullable = false)
    private LocalDateTime dateDetection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.ACTIVE;

    @Column(length = 500)
    private String description;

    public enum Statut {
        ACTIVE, RESOLUE
    }
}