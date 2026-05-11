package com.backend.repository;

import com.backend.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByEmail(String email);
    Optional<Patient> findByEmail(String email);
    List<Patient> findByNomContainingIgnoreCaseOrEmailContainingIgnoreCase(String nom, String email);
}