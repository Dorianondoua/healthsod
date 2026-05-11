package com.backend.repository;

import com.backend.entity.Planning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, Long> {
    List<Planning> findByMedecin_Id(Long medecinId);
    List<Planning> findByMedecin_IdAndDisponibleTrue(Long medecinId);
    List<Planning> findByDisponibleTrue();
} 