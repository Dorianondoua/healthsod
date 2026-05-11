package com.backend.controller;

import com.backend.entity.Alerte;
import com.backend.service.EpidemieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alertes")
@CrossOrigin(origins = "*")
public class AlerteController {

    @Autowired
    private EpidemieService epidemieService;

    @GetMapping
    public ResponseEntity<List<Alerte>> getAlertes() {
        try {
            System.out.println("[AlerteController] Récupération des alertes actives");
            List<Alerte> alertes = epidemieService.getAlertesActives();
            System.out.println("[AlerteController] " + alertes.size() + " alertes trouvées");
            return ResponseEntity.ok(alertes);
        } catch (Exception e) {
            System.err.println("[AlerteController] Erreur lors de la récupération des alertes: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/analyser")
    public ResponseEntity<String> analyserSymptomes() {
        try {
            System.out.println("[AlerteController] Début de l'analyse épidémiologique");
            epidemieService.analyserSymptomes();
            System.out.println("[AlerteController] Analyse épidémiologique terminée avec succès");
            return ResponseEntity.ok("Analyse épidémiologique terminée");
        } catch (Exception e) {
            System.err.println("[AlerteController] Erreur lors de l'analyse: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erreur lors de l'analyse: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/resoudre")
    public ResponseEntity<String> resoudreAlerte(@PathVariable Long id) {
        try {
            System.out.println("[AlerteController] Résolution de l'alerte ID: " + id);
            epidemieService.resoudreAlerte(id);
            System.out.println("[AlerteController] Alerte " + id + " résolue avec succès");
            return ResponseEntity.ok("Alerte résolue");
        } catch (Exception e) {
            System.err.println("[AlerteController] Erreur lors de la résolution de l'alerte " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erreur lors de la résolution: " + e.getMessage());
        }
    }
} 