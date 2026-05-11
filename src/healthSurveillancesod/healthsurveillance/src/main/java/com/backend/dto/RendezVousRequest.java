package com.backend.dto;

import lombok.Data;

@Data
public class RendezVousRequest {
    private String date;
    private String heure;
    private String motif;
    private String medecin_id;
} 