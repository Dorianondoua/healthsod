package com.backend.repository;

import com.backend.entity.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;
 
public interface MedecinRepository extends JpaRepository<Medecin, Long> {
} 