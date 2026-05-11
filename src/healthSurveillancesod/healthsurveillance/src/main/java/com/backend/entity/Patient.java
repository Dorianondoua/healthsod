package com.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false)
    private String nom;

    @NotBlank(message = "Le numéro de sécurité sociale est obligatoire")
    @Size(min = 5, message = "Le numéro de sécurité sociale doit contenir au moins 5 caractères")
    @Column(nullable = false, unique = true)
    private String numero; // Numéro de sécurité sociale

    @NotBlank(message = "Le sexe est obligatoire")
    @Column(nullable = false)
    private String sexe; // "M" ou "F"

    @NotBlank(message = "La ville est obligatoire")
    @Column(nullable = false)
    private String ville;

    @NotBlank(message = "Le quartier est obligatoire")
    @Column(nullable = false)
    private String quartier;

    @NotNull(message = "La date de naissance est obligatoire")
    @Column(nullable = false)
    private LocalDate dateNaissance;

    // Champ pour compatibilité avec le frontend
    @Transient
    private String dateNaissanceString;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    @Column(nullable = false, unique = true)
    private String email;

    private String telephone;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {

        dateCreation = LocalDateTime.now();
    }

    // Méthodes pour convertir entre LocalDate et string
    public String getDateNaissanceString() {
        if (dateNaissanceString != null) {
            return dateNaissanceString;
        }
        return dateNaissance != null ? dateNaissance.toString() : null;
    }

    public void setDateNaissanceString(String dateNaissanceString) {
        this.dateNaissanceString = dateNaissanceString;
        if (dateNaissanceString != null && !dateNaissanceString.isEmpty()) {
            try {
                this.dateNaissance = LocalDate.parse(dateNaissanceString);
            } catch (Exception e) {
                // Si le parsing échoue, on garde la date existante
                System.err.println("Erreur parsing date: " + dateNaissanceString);
            }
        }
    }
}