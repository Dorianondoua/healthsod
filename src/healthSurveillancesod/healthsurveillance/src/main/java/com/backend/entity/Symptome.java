package com.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "symptomes")
public class Symptome {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime heure;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // Champ pour compatibilité avec le frontend
    @Transient
    private Long patientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gravite gravite = Gravite.MODEREE;



    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.ACTIF;

    public enum Gravite {
        FAIBLE, MODEREE, ELEVEE
    }

    public enum Statut {
        ACTIF, RESOLU
    }




    // Méthode pour obtenir l'ID du patient
    public Long getPatientId() {
        if (patientId != null) {
            return patientId;
        }
        return patient != null ? patient.getId() : null;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

}