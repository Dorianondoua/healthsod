package com.backend.repository;

import com.backend.entity.RendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    List<RendezVous> findByPatient_Id(Long patientId);
    List<RendezVous> findByMedecin_Id(Long medecinId);
    void deleteByPatient_Id(Long patientId);
} 