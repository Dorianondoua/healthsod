INSERT INTO users (id, username, password, role) VALUES (1, 'admin', '$2a$10$7QJ6Qw1Qw1Qw1Qw1Qw1QwOQw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1Qw1', 'ADMIN');

-- Insertion de prescriptions de test
INSERT INTO prescriptions (description, date, heure, patient_id, medecin_id, posologie, duree_traitement, statut) VALUES
('Traitement pour fièvre et maux de tête', '2024-01-15', '10:30:00', 1, 1, '1 comprimé 3 fois par jour', '5 jours', 'ACTIVE'),
('Antibiotiques pour infection respiratoire', '2024-01-10', '14:15:00', 1, 1, '1 comprimé 2 fois par jour', '7 jours', 'ACTIVE'),
('Vitamines et compléments alimentaires', '2024-01-05', '09:45:00', 1, 1, '1 comprimé par jour', '30 jours', 'ACTIVE');

-- Insertion des médicaments pour les prescriptions
INSERT INTO prescription_medicaments (prescription_id, medicament) VALUES
(1, 'Paracétamol 500mg'),
(1, 'Ibuprofène 400mg'),
(2, 'Amoxicilline 500mg'),
(3, 'Vitamine C 1000mg'),
(3, 'Vitamine D3 2000 UI');

-- Données de test pour le planning
INSERT INTO plannings (medecin_id, jour, heure_debut, heure_fin, disponible, notes) VALUES
(1, 'MONDAY', '08:00:00', '12:00:00', true, 'Consultation générale'),
(1, 'MONDAY', '14:00:00', '18:00:00', true, 'Consultation spécialisée'),
(1, 'TUESDAY', '09:00:00', '13:00:00', true, 'Consultation matin'),
(1, 'TUESDAY', '15:00:00', '19:00:00', true, 'Consultation après-midi'),
(1, 'WEDNESDAY', '08:00:00', '12:00:00', true, 'Consultation générale'),
(1, 'THURSDAY', '10:00:00', '14:00:00', true, 'Consultation spécialisée'),
(1, 'FRIDAY', '09:00:00', '13:00:00', true, 'Consultation vendredi'),
(1, 'SATURDAY', '09:00:00', '12:00:00', true, 'Consultation samedi matin');