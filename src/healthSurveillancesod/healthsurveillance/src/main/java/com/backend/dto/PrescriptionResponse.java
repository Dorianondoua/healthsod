package com.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class PrescriptionResponse {
    private Long id;
    private String description;
    private LocalDate date;
    private LocalTime heure;
    private String medecin_nom;
    private String patient_nom;
    private List<String> medicaments;
    private String posologie;
    private String duree_traitement;
    private String statut;
} 