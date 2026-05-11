package com.backend.dto;

import lombok.Data;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class PlanningResponse {
    private Long id;
    private Long medecinId;
    private String medecinNom;
    private DayOfWeek jour;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private Boolean disponible;
    private String notes;
} 