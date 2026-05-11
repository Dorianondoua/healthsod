package com.backend.dto;

import lombok.Data;

@Data
public class MedecinRegisterRequest {
    private String nom;
    private String email;
    private String password;
    private String specialite;
    private String telephone;
    private String adresseCabinet;
} 