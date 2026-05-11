package com.backend.service;

import com.backend.dto.AuthRequest;
import com.backend.dto.AuthResponse;
import com.backend.dto.RegisterRequest;
import com.backend.entity.Patient;
import com.backend.entity.Role;
import com.backend.entity.User;
import com.backend.repository.PatientRepository;
import com.backend.repository.UserRepository;
import com.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = new User();
        user.setNom(request.getNom());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.PATIENT);
        userRepository.save(user);

        Patient patient = new Patient();
        patient.setNom(request.getNom());
        patient.setEmail(request.getEmail());
        patient.setNumero(request.getNumero());
        patient.setSexe(request.getSexe());
        patient.setVille(request.getVille());
        patient.setQuartier(request.getQuartier());
        patient.setTelephone(request.getTelephone());

        // Conversion String -> LocalDate (format attendu : "yyyy-MM-dd")
        patient.setDateNaissance(LocalDate.parse(request.getDateNaissance()));

        patient.setUser(user);
        patientRepository.save(patient);

        String token = jwtUtil.generateToken(user);

        return new AuthResponse(token, user.getId(), user.getNom(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (!user.getRole().name().equalsIgnoreCase(request.getRole())) {
            throw new RuntimeException("Rôle non autorisé pour cet utilisateur.");
        }
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getNom(), user.getEmail(), user.getRole().name());
    }
}