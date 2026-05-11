package com.backend.controller;

import com.backend.entity.Patient;
import com.backend.entity.Symptome;
import com.backend.entity.Suivi;
import com.backend.entity.Encadreur;
import com.backend.repository.PatientRepository;
import com.backend.repository.SymptomeRepository;
import com.backend.repository.SuiviRepository;
import com.backend.repository.EncadreurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/encadreur")
@CrossOrigin(origins = "*")
public class EncadreurController {
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private SymptomeRepository symptomeRepository;
    @Autowired
    private SuiviRepository suiviRepository;
    @Autowired
    private EncadreurRepository encadreurRepository;

    @GetMapping("/patient")
    public Patient getPatientByEmail(@RequestParam String email) {
        return patientRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Patient non trouvé"));
    }

    @GetMapping("/patient/{id}/symptomes")
    public List<Symptome> getSymptomes(@PathVariable Long id) {
        return symptomeRepository.findByPatient_Id(id);
    }

    @GetMapping("/patient/{id}/suivis")
    public List<Suivi> getSuivis(@PathVariable Long id) {
        return suiviRepository.findByPatientId(id);
    }
} 