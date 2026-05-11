package com.backend.dto;

import lombok.Data;

@Data
public class EncadreurRegisterRequest {
    private String nom;
    private String email;
    private String password;
} 