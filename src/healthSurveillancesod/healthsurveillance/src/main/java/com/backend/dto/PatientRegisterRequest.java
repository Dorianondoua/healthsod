package com.backend.dto;

import lombok.Data;

@Data
public class PatientRegisterRequest {
    private String nom;
    private String email;
    private String password;
    private String numero;
    private String sexe;
    private String ville;
    private String quartier;
    private String telephone;
    private String dateNaissance; // format "yyyy-MM-dd"
} 