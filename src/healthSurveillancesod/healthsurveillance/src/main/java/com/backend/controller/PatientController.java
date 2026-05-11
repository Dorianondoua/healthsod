package com.backend.controller;

import com.backend.dto.PatientRegisterRequest;
import com.backend.dto.AuthRequest;
import com.backend.dto.AuthResponse;
import com.backend.dto.PrescriptionResponse;
import com.backend.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.backend.entity.Symptome;
import com.backend.entity.Prescription;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.stream.Collectors;
import com.backend.entity.Patient;
import com.backend.dto.RendezVousRequest;
import com.backend.entity.RendezVous;
import com.backend.entity.Medecin;
import com.backend.repository.RendezVousRepository;
import com.backend.repository.MedecinRepository;
import com.backend.repository.PrescriptionRepository;
import java.time.LocalDate;
import java.time.LocalTime;


@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private RendezVousRepository rendezVousRepository;

    @Autowired
    private MedecinRepository medecinRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody PatientRegisterRequest request) {
        try {
            AuthResponse response = patientService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email déjà utilisé")) {
                return ResponseEntity.badRequest().body("{\"error\": \"Email déjà utilisé\"}");
            } else if (e.getMessage().contains("numéro de sécurité sociale")) {
                return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Erreur interne du serveur\"}");
        }
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        return patientService.login(request);
    }

    // Ajouter un symptôme
    @PostMapping("/{id}/symptomes")
    public ResponseEntity<Symptome> ajouterSymptome(@PathVariable("id") Long patientId, @RequestBody Symptome symptome) {
        System.out.println("DEBUG CONTROLLER : entrée dans ajouterSymptome, patientId = " + patientId);
        Symptome saved = patientService.ajouterSymptome(patientId, symptome);
        return ResponseEntity.ok(saved);
    }

    // Récupérer l'historique des symptômes
    @GetMapping("/{id}/symptomes")
    public ResponseEntity<List<Symptome>> getSymptomes(@PathVariable("id") Long patientId) {
        List<Symptome> symptomes = patientService.getSymptomes(patientId);
        return ResponseEntity.ok(symptomes);
    }

    @GetMapping("/by-email/{email}")
    public ResponseEntity<Patient> getPatientByEmail(@PathVariable String email) {
        return ResponseEntity.of(patientService.getPatientByEmail(email));
    }

    @PostMapping("/{id}/rendezvous")
    public RendezVous prendreRendezVous(@PathVariable Long id, @RequestBody RendezVousRequest request) {
        // Validation des données
        if (request.getMedecin_id() == null || request.getMedecin_id().trim().isEmpty()) {
            throw new RuntimeException("ID du médecin requis");
        }
        if (request.getDate() == null || request.getDate().trim().isEmpty()) {
            throw new RuntimeException("Date requise");
        }
        if (request.getHeure() == null || request.getHeure().trim().isEmpty()) {
            throw new RuntimeException("Heure requise");
        }

        Patient patient = patientService.getPatientById(id)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        Long medecinId;
        try {
            medecinId = Long.parseLong(request.getMedecin_id());
        } catch (NumberFormatException e) {
            throw new RuntimeException("ID du médecin invalide");
        }
        
        Medecin medecin = medecinRepository.findById(medecinId)
            .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));

        RendezVous rdv = new RendezVous();
        rdv.setPatient(patient);
        rdv.setMedecin(medecin);
        rdv.setDate(LocalDate.parse(request.getDate()));
        rdv.setHeure(LocalTime.parse(request.getHeure()));
        rdv.setMotif(request.getMotif());
        rdv.setStatut(RendezVous.Statut.EN_ATTENTE);

        return rendezVousRepository.save(rdv);
    }

    @GetMapping("/{id}/rendezvous")
    public List<RendezVous> getRendezVous(@PathVariable Long id) {
        return rendezVousRepository.findByPatient_Id(id);
    }

    @GetMapping("/{id}/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptions(@PathVariable Long id) {
        List<Prescription> prescriptions = prescriptionRepository.findByPatient_Id(id);
        
        List<PrescriptionResponse> responses = prescriptions.stream()
            .map(prescription -> {
                PrescriptionResponse response = new PrescriptionResponse();
                response.setId(prescription.getId());
                response.setDescription(prescription.getDescription());
                response.setDate(prescription.getDate());
                response.setHeure(prescription.getHeure());
                response.setMedecin_nom(prescription.getMedecin().getNom());
                response.setPatient_nom(prescription.getPatient().getNom());
                response.setMedicaments(prescription.getMedicaments());
                response.setPosologie(prescription.getPosologie());
                response.setDuree_traitement(prescription.getDureeTraitement());
                response.setStatut(prescription.getStatut().name().toLowerCase());
                return response;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
} 