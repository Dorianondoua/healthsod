package com.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class PrescriptionRequest {
    private String patientId;
    private String medecinId;
    private String description;
    private LocalDate date;
    private LocalTime heure;
    private String medicaments; // Chaîne séparée par des virgules
    private String posologie;
    private String duree_traitement;
} 