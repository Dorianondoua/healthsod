package com.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La description est obligatoire")
    @Column(nullable = false)
    private String description;

    @NotNull(message = "La date est obligatoire")
    @Column(nullable = false)
    private LocalDate date;

    @NotNull(message = "L'heure est obligatoire")
    @Column(nullable = false)
    private LocalTime heure;

    @NotNull(message = "Le patient est obligatoire")
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @NotNull(message = "Le médecin est obligatoire")
    @ManyToOne
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;

    @NotNull(message = "La liste des médicaments est obligatoire")
    @Size(min = 1, message = "Au moins un médicament doit être renseigné")
    @ElementCollection
    @CollectionTable(name = "prescription_medicaments", joinColumns = @JoinColumn(name = "prescription_id"))
    @Column(name = "medicament")
    private List<String> medicaments;

    private String posologie;

    private String dureeTraitement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.ACTIVE;

    public enum Statut {
        ACTIVE, TERMINEE
    }
}