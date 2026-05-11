package com.backend.repository;

import com.backend.entity.Symptome;
import com.backend.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SymptomeRepository extends JpaRepository<Symptome, Long> {
    List<Symptome> findByPatient(Patient patient);
    List<Symptome> findByPatient_Id(Long patientId);
    void deleteByPatient_Id(Long patientId);
} 