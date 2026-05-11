package com.backend.dto;

import lombok.Data;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class PlanningRequest {
    private Long medecinId;
    private DayOfWeek jour;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private Boolean disponible;
    private String notes;
} 