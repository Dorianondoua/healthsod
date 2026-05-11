package com.backend.controller;

import com.backend.entity.Medecin;
import com.backend.entity.Patient;
import com.backend.entity.Encadreur;
import com.backend.repository.MedecinRepository;
import com.backend.repository.PatientRepository;
import com.backend.repository.EncadreurRepository;
import com.backend.dto.MedecinRegisterRequest;
import com.backend.dto.EncadreurRegisterRequest;
import com.backend.entity.User;
import com.backend.entity.Role;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.backend.repository.SymptomeRepository;
import com.backend.repository.PrescriptionRepository;
import com.backend.repository.RendezVousRepository;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    @Autowired
    private MedecinRepository medecinRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private EncadreurRepository encadreurRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private SymptomeRepository symptomeRepository;
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    @Autowired
    private RendezVousRepository rendezVousRepository;

    @GetMapping("/medecins")
    public List<Medecin> getMedecins() {
        return medecinRepository.findAll();
    }

    @GetMapping("/patients")
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientRepository.findAll();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/encadreurs")
    public List<Encadreur> getEncadreurs() {
        return encadreurRepository.findAll();
    }

    @GetMapping("/statistiques")
    public Map<String, Object> getStatistiques() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPatients", patientRepository.count());
        stats.put("totalMedecins", medecinRepository.count());
        // Ajoute d'autres stats si besoin
        return stats;
    }

    @PostMapping("/medecins")
    @Transactional
    public Medecin addMedecin(@RequestBody MedecinRegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }
        User user = new User();
        user.setNom(request.getNom());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.MEDECIN);
        userRepository.save(user);

        Medecin medecin = new Medecin();
        medecin.setNom(request.getNom());
        medecin.setEmail(request.getEmail());
        medecin.setSpecialite(request.getSpecialite());
        medecin.setTelephone(request.getTelephone());
        medecin.setAdresseCabinet(request.getAdresseCabinet());
        medecin.setStatut(Medecin.Statut.ACTIF);
        medecin.setUser(user);
        medecinRepository.save(medecin);
        return medecin;
    }

    @PostMapping("/encadreurs")
    @Transactional
    public Encadreur addEncadreur(@RequestBody EncadreurRegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }
        User user = new User();
        user.setNom(request.getNom());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ENCADREUR);
        userRepository.save(user);

        Encadreur encadreur = new Encadreur();
        encadreur.setNom(request.getNom());
        encadreur.setEmail(request.getEmail());
        encadreur.setUser(user);
        encadreurRepository.save(encadreur);
        return encadreur;
    }

    @DeleteMapping("/patients/{id}")
    @Transactional
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        try {
            // Vérifier si le patient existe
            if (!patientRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            // Supprimer d'abord les données liées
            // 1. Supprimer les symptômes du patient
            symptomeRepository.deleteByPatient_Id(id);
            
            // 2. Supprimer les prescriptions du patient
            prescriptionRepository.deleteByPatient_Id(id);
            
            // 3. Supprimer les rendez-vous du patient
            rendezVousRepository.deleteByPatient_Id(id);
            
            // 4. Maintenant supprimer le patient
            patientRepository.deleteById(id);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression du patient: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
} 