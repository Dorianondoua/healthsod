package com.backend.service;

import com.backend.entity.Alerte;
import com.backend.entity.Symptome;
import com.backend.repository.AlerteRepository;
import com.backend.repository.SymptomeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EpidemieService {

    @Autowired
    private SymptomeRepository symptomeRepository;

    @Autowired
    private AlerteRepository alerteRepository;

    private static final int SEUIL_ALERTE = 5; // Nombre minimum de patients pour déclencher une alerte

    public void analyserSymptomes() {
        try {
            // Récupérer tous les symptômes actifs (non résolus)
            List<Symptome> symptomes = symptomeRepository.findAll().stream()
                .filter(s -> s.getStatut() == Symptome.Statut.ACTIF)
                .collect(Collectors.toList());
            
            if (symptomes.isEmpty()) {
                System.out.println("Aucun symptôme actif trouvé pour l'analyse");
                return;
            }
            
            // Grouper par symptôme, ville et quartier
            Map<String, Long> groupes = symptomes.stream()
                .collect(Collectors.groupingBy(
                    s -> s.getDescription() + "|" + s.getPatient().getVille() + "|" + s.getPatient().getQuartier(),
                    Collectors.counting()
                ));

            System.out.println("Groupes de symptômes trouvés: " + groupes.size());
            
            // Vérifier chaque groupe pour créer des alertes
            for (Map.Entry<String, Long> entry : groupes.entrySet()) {
                System.out.println("Analyse du groupe: " + entry.getKey() + " = " + entry.getValue() + " patients");
                
                if (entry.getValue() >= SEUIL_ALERTE) {
                    String[] parts = entry.getKey().split("\\|");
                    String symptome = parts[0];
                    String ville = parts[1];
                    String quartier = parts[2];
                    
                    // Vérifier si une alerte existe déjà
                    boolean alerteExiste = alerteRepository.findByStatut(Alerte.Statut.ACTIVE)
                        .stream()
                        .anyMatch(a -> a.getSymptome().equals(symptome) && 
                                     a.getVille().equals(ville) && 
                                     a.getQuartier().equals(quartier));
                    
                    if (!alerteExiste) {
                        // Créer une nouvelle alerte
                        Alerte alerte = Alerte.builder()
                            .symptome(symptome)
                            .ville(ville)
                            .quartier(quartier)
                            .nombrePatients(entry.getValue().intValue())
                            .dateDetection(LocalDateTime.now())
                            .statut(Alerte.Statut.ACTIVE)
                            .description("Épidémie détectée : " + entry.getValue() + " patients avec le symptôme '" + symptome + "' dans " + ville + ", " + quartier)
                            .build();
                        
                        Alerte savedAlerte = alerteRepository.save(alerte);
                        System.out.println("Nouvelle alerte créée: " + savedAlerte.getId() + " pour " + symptome + " à " + ville + ", " + quartier);
                    } else {
                        System.out.println("Alerte déjà existante pour " + symptome + " à " + ville + ", " + quartier);
                    }
                } else {
                    System.out.println("Groupe " + entry.getKey() + " ne dépasse pas le seuil (" + entry.getValue() + " < " + SEUIL_ALERTE + " patients minimum)");
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de l'analyse des symptômes: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public List<Alerte> getAlertesActives() {
        return alerteRepository.findActiveAlertes();
    }

    public void resoudreAlerte(Long alerteId) {
        try {
            var alerteOpt = alerteRepository.findById(alerteId);
            if (alerteOpt.isPresent()) {
                Alerte alerte = alerteOpt.get();
                alerte.setStatut(Alerte.Statut.RESOLUE);
                Alerte savedAlerte = alerteRepository.save(alerte);
                System.out.println("Alerte résolue: " + savedAlerte.getId() + " - " + savedAlerte.getSymptome() + " à " + savedAlerte.getVille() + ", " + savedAlerte.getQuartier());
            } else {
                System.err.println("Alerte non trouvée avec l'ID: " + alerteId);
                throw new RuntimeException("Alerte non trouvée avec l'ID: " + alerteId);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la résolution de l'alerte: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
} 