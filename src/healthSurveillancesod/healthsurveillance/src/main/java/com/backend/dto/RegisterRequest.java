package com.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String nom;
    private String email;
    private String password;
    private String numero;
    private String sexe;
    private String ville;
    private String quartier;
    private String telephone;
    private String dateNaissance; // Ex: "2000-01-01"
}