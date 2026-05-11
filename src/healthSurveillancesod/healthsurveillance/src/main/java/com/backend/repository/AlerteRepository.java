package com.backend.repository;

import com.backend.entity.Alerte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlerteRepository extends JpaRepository<Alerte, Long> {
    List<Alerte> findByStatut(Alerte.Statut statut);
    
    @Query("SELECT a FROM Alerte a WHERE a.statut = 'ACTIVE' ORDER BY a.dateDetection DESC")
    List<Alerte> findActiveAlertes();
    
    @Query("SELECT COUNT(s) FROM Symptome s WHERE s.description = :symptome AND s.patient.ville = :ville AND s.patient.quartier = :quartier")
    Long countSymptomesByLocation(@Param("symptome") String symptome, @Param("ville") String ville, @Param("quartier") String quartier);
} 