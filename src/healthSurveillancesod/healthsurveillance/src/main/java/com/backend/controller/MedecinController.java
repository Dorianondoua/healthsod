package com.backend.controller;

import com.backend.entity.Patient;
import com.backend.entity.Symptome;
import com.backend.entity.Prescription;
import com.backend.entity.RendezVous;
import com.backend.entity.Medecin;
import com.backend.entity.Planning;
import com.backend.entity.Alerte;
import com.backend.repository.PatientRepository;
import com.backend.repository.SymptomeRepository;
import com.backend.repository.MedecinRepository;
import com.backend.repository.PrescriptionRepository;
import com.backend.repository.RendezVousRepository;
import com.backend.repository.PlanningRepository;
import com.backend.dto.PrescriptionRequest;
import com.backend.dto.PlanningRequest;
import com.backend.dto.PlanningResponse;
import com.backend.service.EpidemieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/medecins")
@CrossOrigin(origins = "*")
public class MedecinController {
    @Autowired
    private PatientRepository patientRepository;
    @Autowired(required = false)
    private SymptomeRepository symptomeRepository;
    @Autowired
    private MedecinRepository medecinRepository;
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    @Autowired
    private RendezVousRepository rendezVousRepository;
    @Autowired
    private PlanningRepository planningRepository;
    @Autowired
    private EpidemieService epidemieService;

    @GetMapping("/patients")
    public List<Patient> getPatients() {
        return patientRepository.findAll();
    }

    @GetMapping("/patients/search")
    public ResponseEntity<List<Patient>> searchPatients(@RequestParam String query) {
        List<Patient> patients = patientRepository.findByNomContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/patients/{patientId}/symptomes")
    public ResponseEntity<List<Symptome>> getSymptomesPatient(@PathVariable Long patientId) {
        if (symptomeRepository != null) {
            List<Symptome> symptomes = symptomeRepository.findByPatient_Id(patientId);
            return ResponseEntity.ok(symptomes);
        } else {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/symptomes")
    public List<Symptome> getSymptomes() {
        if (symptomeRepository != null) {
            return symptomeRepository.findAll();
        } else {
            return List.of();
        }
    }

    @GetMapping("/prescriptions")
    public List<Prescription> getPrescriptions() {
        return prescriptionRepository.findAll();
    }

    @GetMapping("/rendezvous")
    public List<RendezVous> getRendezVous() {
        return rendezVousRepository.findAll();
    }

    @GetMapping("/rendezvous/{medecinId}")
    public ResponseEntity<List<RendezVous>> getRendezVousMedecin(@PathVariable Long medecinId) {
        System.out.println("[MedecinController] getRendezVousMedecin: medecinId = " + medecinId);
        
        // Vérifier si le médecin existe
        Optional<Medecin> medecinOpt = medecinRepository.findById(medecinId);
        if (medecinOpt.isEmpty()) {
            System.out.println("[MedecinController] Médecin non trouvé avec l'ID: " + medecinId);
            return ResponseEntity.notFound().build();
        }
        
        List<RendezVous> rendezVous = rendezVousRepository.findByMedecin_Id(medecinId);
        System.out.println("[MedecinController] Rendez-vous trouvés: " + rendezVous.size());
        
        // Afficher les détails des rendez-vous
        for (RendezVous rdv : rendezVous) {
            System.out.println("  - RDV ID: " + rdv.getId() + 
                             ", Patient: " + rdv.getPatient().getNom() + 
                             ", Date: " + rdv.getDate() + 
                             ", Statut: " + rdv.getStatut());
        }
        
        return ResponseEntity.ok(rendezVous);
    }

    @PutMapping("/rendezvous/{rdvId}/statut")
    public ResponseEntity<RendezVous> updateRendezVousStatut(
            @PathVariable Long rdvId,
            @RequestBody RendezVousStatutRequest request) {
        
        Optional<RendezVous> rdvOpt = rendezVousRepository.findById(rdvId);
        if (rdvOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        RendezVous rdv = rdvOpt.get();
        rdv.setStatut(request.getStatut());
        
        if (request.getNouvelleDate() != null) {
            rdv.setDate(request.getNouvelleDate());
        }
        if (request.getNouvelleHeure() != null) {
            rdv.setHeure(request.getNouvelleHeure());
        }
        if (request.getNotesMedecin() != null) {
            rdv.setNotesMedecin(request.getNotesMedecin());
        }

        RendezVous updatedRdv = rendezVousRepository.save(rdv);
        return ResponseEntity.ok(updatedRdv);
    }

    @PostMapping("/prescriptions")
    public ResponseEntity<Prescription> creerPrescription(@RequestBody PrescriptionRequest request) {
        try {
            // Récupérer le patient
            Optional<Patient> patientOpt = patientRepository.findById(Long.parseLong(request.getPatientId()));
            if (patientOpt.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Récupérer le médecin
            Optional<Medecin> medecinOpt = medecinRepository.findById(Long.parseLong(request.getMedecinId()));
            if (medecinOpt.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Convertir la chaîne de médicaments en liste
            List<String> medicamentsList = null;
            if (request.getMedicaments() != null && !request.getMedicaments().trim().isEmpty()) {
                medicamentsList = Arrays.asList(request.getMedicaments().split(","));
            }
            
            // Créer la prescription
            Prescription prescription = Prescription.builder()
                .patient(patientOpt.get())
                .medecin(medecinOpt.get())
                .description(request.getDescription())
                .date(request.getDate() != null ? request.getDate() : LocalDate.now())
                .heure(request.getHeure() != null ? request.getHeure() : LocalTime.now())
                .medicaments(medicamentsList)
                .posologie(request.getPosologie())
                .dureeTraitement(request.getDuree_traitement())
                .statut(Prescription.Statut.ACTIVE)
                .build();
            
            Prescription savedPrescription = prescriptionRepository.save(prescription);
            return ResponseEntity.ok(savedPrescription);
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de prescription: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("")
    public List<Medecin> getAllMedecins() {
        List<Medecin> medecins = medecinRepository.findAll();
        System.out.println("[MedecinController] getAllMedecins: nb=" + medecins.size());
        for (Medecin m : medecins) {
            System.out.println("  - " + m.getNom() + " (id=" + m.getId() + ")");
        }
        return medecins;
    }

    @GetMapping("/me")
    public ResponseEntity<Medecin> getMedecinConnecte(@RequestParam String email) {
        System.out.println("[MedecinController] getMedecinConnecte: email = " + email);
        
        // Chercher le médecin par email
        List<Medecin> medecins = medecinRepository.findAll();
        for (Medecin medecin : medecins) {
            if (medecin.getEmail().equals(email)) {
                System.out.println("[MedecinController] Médecin trouvé: " + medecin.getNom() + " (id=" + medecin.getId() + ")");
                return ResponseEntity.ok(medecin);
            }
        }
        
        System.out.println("[MedecinController] Aucun médecin trouvé avec l'email: " + email);
        return ResponseEntity.notFound().build();
    }

    // Classe interne pour la requête de mise à jour du statut
    public static class RendezVousStatutRequest {
        private RendezVous.Statut statut;
        private java.time.LocalDate nouvelleDate;
        private java.time.LocalTime nouvelleHeure;
        private String notesMedecin;

        // Getters et setters
        public RendezVous.Statut getStatut() { return statut; }
        public void setStatut(RendezVous.Statut statut) { this.statut = statut; }
        
        public java.time.LocalDate getNouvelleDate() { return nouvelleDate; }
        public void setNouvelleDate(java.time.LocalDate nouvelleDate) { this.nouvelleDate = nouvelleDate; }
        
        public java.time.LocalTime getNouvelleHeure() { return nouvelleHeure; }
        public void setNouvelleHeure(java.time.LocalTime nouvelleHeure) { this.nouvelleHeure = nouvelleHeure; }
        
        public String getNotesMedecin() { return notesMedecin; }
        public void setNotesMedecin(String notesMedecin) { this.notesMedecin = notesMedecin; }
    }

    // Endpoints pour le planning
    @GetMapping("/planning")
    public ResponseEntity<List<PlanningResponse>> getPlanning() {
        List<Planning> plannings = planningRepository.findAll();
        
        List<PlanningResponse> responses = plannings.stream()
            .map(planning -> {
                PlanningResponse response = new PlanningResponse();
                response.setId(planning.getId());
                response.setMedecinId(planning.getMedecin().getId());
                response.setMedecinNom(planning.getMedecin().getNom());
                response.setJour(planning.getJour());
                response.setHeureDebut(planning.getHeureDebut());
                response.setHeureFin(planning.getHeureFin());
                response.setDisponible(planning.getDisponible());
                response.setNotes(planning.getNotes());
                return response;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/planning/{medecinId}")
    public ResponseEntity<List<PlanningResponse>> getPlanningMedecin(@PathVariable Long medecinId) {
        List<Planning> plannings = planningRepository.findByMedecin_Id(medecinId);
        
        List<PlanningResponse> responses = plannings.stream()
            .map(planning -> {
                PlanningResponse response = new PlanningResponse();
                response.setId(planning.getId());
                response.setMedecinId(planning.getMedecin().getId());
                response.setMedecinNom(planning.getMedecin().getNom());
                response.setJour(planning.getJour());
                response.setHeureDebut(planning.getHeureDebut());
                response.setHeureFin(planning.getHeureFin());
                response.setDisponible(planning.getDisponible());
                response.setNotes(planning.getNotes());
                return response;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/planning")
    public ResponseEntity<Planning> creerPlanning(@RequestBody PlanningRequest request) {
        Optional<Medecin> medecinOpt = medecinRepository.findById(request.getMedecinId());
        if (medecinOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Planning planning = Planning.builder()
            .medecin(medecinOpt.get())
            .jour(request.getJour())
            .heureDebut(request.getHeureDebut())
            .heureFin(request.getHeureFin())
            .disponible(request.getDisponible() != null ? request.getDisponible() : true)
            .notes(request.getNotes())
            .build();

        Planning savedPlanning = planningRepository.save(planning);
        return ResponseEntity.ok(savedPlanning);
    }

    @PutMapping("/planning/{id}")
    public ResponseEntity<Planning> modifierPlanning(@PathVariable Long id, @RequestBody PlanningRequest request) {
        Optional<Planning> planningOpt = planningRepository.findById(id);
        if (planningOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Planning planning = planningOpt.get();
        planning.setJour(request.getJour());
        planning.setHeureDebut(request.getHeureDebut());
        planning.setHeureFin(request.getHeureFin());
        planning.setDisponible(request.getDisponible());
        planning.setNotes(request.getNotes());

        Planning updatedPlanning = planningRepository.save(planning);
        return ResponseEntity.ok(updatedPlanning);
    }

    @DeleteMapping("/planning/{id}")
    public ResponseEntity<Void> supprimerPlanning(@PathVariable Long id) {
        if (!planningRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        planningRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/planning-disponibilite")
    public ResponseEntity<List<PlanningResponse>> getPlanningDisponibilite() {
        // Récupérer tous les plannings disponibles de tous les médecins
        List<Planning> plannings = planningRepository.findByDisponibleTrue();
        
        List<PlanningResponse> responses = plannings.stream()
            .map(planning -> {
                PlanningResponse response = new PlanningResponse();
                response.setId(planning.getId());
                response.setMedecinId(planning.getMedecin().getId());
                response.setMedecinNom(planning.getMedecin().getNom());
                response.setJour(planning.getJour());
                response.setHeureDebut(planning.getHeureDebut());
                response.setHeureFin(planning.getHeureFin());
                response.setDisponible(planning.getDisponible());
                response.setNotes(planning.getNotes());
                return response;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/alertes")
    public ResponseEntity<List<Alerte>> getAlertes() {
        List<Alerte> alertes = epidemieService.getAlertesActives();
        return ResponseEntity.ok(alertes);
    }
} 