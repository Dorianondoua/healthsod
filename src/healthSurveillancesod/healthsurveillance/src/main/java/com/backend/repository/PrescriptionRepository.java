package com.backend.repository;

import com.backend.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatient_Id(Long patientId);
    List<Prescription> findByMedecin_Id(Long medecinId);
    void deleteByPatient_Id(Long patientId);
} 