package com.backend.service;

import com.backend.dto.PatientRegisterRequest;
import com.backend.dto.AuthResponse;
import com.backend.entity.Patient;
import com.backend.entity.Role;
import com.backend.entity.User;
import com.backend.entity.Symptome;
import com.backend.repository.PatientRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.SymptomeRepository;
import com.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import com.backend.service.EpidemieService;

import java.time.LocalDate;

@Service
public class PatientService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private SymptomeRepository symptomeRepository;
    @Autowired
    private EpidemieService epidemieService;

    public AuthResponse register(PatientRegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = User.builder()
                .nom(request.getNom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PATIENT)
                .build();
        userRepository.save(user);

        Patient patient = Patient.builder()
                .nom(request.getNom())
                .email(request.getEmail())
                .numero(request.getNumero())
                .sexe(request.getSexe())
                .ville(request.getVille())
                .quartier(request.getQuartier())
                .telephone(request.getTelephone())
                .dateNaissance(LocalDate.parse(request.getDateNaissance()))
                .user(user)
                .build();

        patientRepository.save(patient);

        String token = jwtUtil.generateToken(user);

        return new AuthResponse(token, user.getId(), user.getNom(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(com.backend.dto.AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }
        if (user.getRole() != Role.PATIENT) {
            throw new RuntimeException("Seuls les patients peuvent se connecter ici.");
        }
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getNom(), user.getEmail(), user.getRole().name());
    }

    // Ajouter un symptôme pour un patient
    public Symptome ajouterSymptome(Long patientId, Symptome symptome) {
        // Récupère l'email de l'utilisateur connecté
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        System.out.println("Ajout symptome pour email=" + email);
        // Cherche le patient par email
        Patient patient = patientRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        // Contrôle d'accès : le patient connecté ne peut ajouter des symptômes que pour lui-même
        System.out.println("DEBUG AJOUT SYMPTOME : patient.getId() = " + patient.getId() + ", patientId (URL) = " + patientId);
        if (!patient.getId().toString().equals(patientId.toString())) {
            System.out.println("DEBUG ACCES REFUSE : ids differents !");
            throw new org.springframework.security.access.AccessDeniedException("Accès interdit");
        }
        System.out.println("DEBUG ACCES AUTORISE : ids identiques !");
        symptome.setPatient(patient);
        symptome.setDate(java.time.LocalDate.now());
        symptome.setHeure(java.time.LocalTime.now());
        Symptome savedSymptome = symptomeRepository.save(symptome);
        // Appel de l'analyse d'épidémie, sans bloquer l'ajout du symptôme
        try {
            epidemieService.analyserSymptomes();
        } catch (Exception e) {
            System.err.println("Erreur lors de l'analyse d'épidémie après ajout symptôme: " + e.getMessage());
        }
        return savedSymptome;
    }

    // Récupérer la liste des symptômes d'un patient
    public java.util.List<Symptome> getSymptomes(Long patientId) {
        return symptomeRepository.findByPatient_Id(patientId);
    }

    public java.util.Optional<Patient> getPatientByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    public java.util.Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }
} 