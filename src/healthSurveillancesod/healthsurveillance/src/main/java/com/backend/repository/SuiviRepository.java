package com.backend.repository;

import com.backend.entity.Suivi;
import com.backend.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SuiviRepository extends JpaRepository<Suivi, Long> {
    List<Suivi> findByPatientId(Long patientId);
} 