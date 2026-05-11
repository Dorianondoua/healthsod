"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import api from "@/lib/axios"

// Types pour les rôles
type Role = "patient" | "medecin" | "admin" | "encadreur"

// Interface pour l'utilisateur
interface User {
  id?: string
  nom: string
  email: string
  role: Role
  token?: string
}

// Interface pour le patient
interface Patient {
  id?: string
  nom: string
  numero: string // Numéro de sécurité sociale
  sexe: "M" | "F"
  ville: string
  quartier: string
  date_naissance: string
  email: string
  telephone?: string
  date_creation?: string
  user?: User
}

// Interface pour le médecin
interface Medecin {
  id?: string
  nom: string
  specialite: string
  email: string
  telephone: string
  adresse_cabinet: string
  date_creation?: string
  statut?: "actif" | "inactif"
  user?: User
}

// Interface pour l'administrateur
interface Admin {
  id?: string
  nom: string
  email: string
  date_creation?: string
  user?: User
}

// Interface pour l'encadreur
interface Encadreur {
  id?: string
  nom: string
  email: string
  date_creation?: string
  user?: User
}

// Interface pour les symptômes
interface Symptome {
  id?: string
  description: string
  date: string
  heure: string
  patientId?: string
  patient_nom?: string
  gravite?: "faible" | "moderee" | "elevee"
  statut?: "actif" | "resolu"
}

// Interface pour les rendez-vous
interface RendezVous {
  id?: string
  nom_patient: string
  nom_medecin: string
  patientId: string
  medecin_id: string
  date: string
  heure: string
  statut: "en_attente" | "confirme" | "annule" | "reporte"
  motif?: string
  notes_medecin?: string
  date_creation?: string
}

// Interface pour les prescriptions
interface Prescription {
  id?: string
  description: string
  date: string
  heure: string
  nom_patient: string
  patientId: string
  medecin_id: string
  medecin_nom?: string
  medicaments?: string[]
  posologie?: string
  duree_traitement?: string
  statut?: "active" | "terminee"
}

// Interface pour le planning
interface Planning {
  id?: string
  medecinId: string
  medecinNom: string
  jour: string
  heureDebut: string
  heureFin: string
  disponible: boolean
  notes?: string
}

// Interface pour les alertes épidémiologiques
interface Alerte {
  id?: string
  symptome: string
  ville: string
  quartier: string
  nombre_patients: number
  date_detection: string
  statut: "active" | "resolue"
  description?: string
}

// Interface pour le calendrier du médecin
interface CalendrierMedecin {
  id?: string
  medecin_id: string
  jour_semaine: string // "lundi", "mardi", etc.
  heure_debut: string
  heure_fin: string
  disponible: boolean
  pause_debut?: string
  pause_fin?: string
}

// Interface pour le contexte d'authentification
interface AuthContextType {
  user: User | null
  patient: Patient | null
  medecin: Medecin | null
  admin: Admin | null
  encadreur: Encadreur | null
  login: (email: string, password: string, role: Role) => Promise<{ success: boolean; message?: string }>
  register: (form: any) => Promise<void>
  logout: () => void
  // Fonctionnalités patient
  ajouterSymptome: (symptome: Omit<Symptome, 'id'>) => Promise<void>
  getSymptomes: (patientId: string) => Promise<Symptome[]>
  prendreRendezVous: (rdv: { medecin_id: string; date: string; heure: string; motif: string }) => Promise<void>
  getRendezVous: (patientId: string) => Promise<RendezVous[]>
  getPrescriptions: (patientId: string) => Promise<Prescription[]>
  // Fonctionnalités médecin
  getPatients: () => Promise<Patient[]>
  searchPatients: (query: string) => Promise<Patient[]>
  getSymptomesPatient: (patientId: string) => Promise<Symptome[]>
  getRendezVousMedecin: (medecinId: string) => Promise<RendezVous[]>
  validerRendezVous: (rdvId: string, statut: RendezVous['statut'], notes?: string) => Promise<void>
  ajouterPrescription: (prescription: Omit<Prescription, 'id'>) => Promise<void>
  gererCalendrier: (calendrier: CalendrierMedecin[]) => Promise<void>
  // Fonctionnalités admin
  ajouterMedecin: (medecin: Omit<Medecin, 'id'>) => Promise<void>
  ajouterEncadreur: (encadreur: Omit<Encadreur, 'id'>) => Promise<void>
  getMedecins: () => Promise<Medecin[]>
  getEncadreurs: () => Promise<Encadreur[]>
  // Fonctionnalités encadreur
  rechercherPatient: (email: string) => Promise<Patient | null>
  getSymptomesPatientEncadreur: (patientId: string) => Promise<Symptome[]>
  // Fonctionnalités alertes
  getAlertes: () => Promise<Alerte[]>
  analyserSymptomes: () => Promise<void>
  resoudreAlerte: (alerteId: string) => Promise<void>
  detecterEpidemie: () => Promise<void>
  // Fonctions pour le planning
  getPlanning: () => Promise<Planning[]>
  getPlanningMedecin: (medecinId: string) => Promise<Planning[]>
  creerPlanning: (planning: Omit<Planning, 'id'>) => Promise<void>
  modifierPlanning: (id: string, planning: Omit<Planning, 'id'>) => Promise<void>
  supprimerPlanning: (id: string) => Promise<void>
  getPlanningDisponibilite: () => Promise<Planning[]>
  // Fonctionnalités admin
  deletePatient: (patientId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [medecin, setMedecin] = useState<Medecin | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [encadreur, setEncadreur] = useState<Encadreur | null>(null)

  // Restaure le user depuis le localStorage à l'initialisation
  useEffect(() => {
    console.log("USEEFFECT INIT appelé");
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > now) {
          const userObj = JSON.parse(storedUser);
          setUser(userObj);
        } else {
          // Token expiré, on nettoie
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
          setPatient(null);
        }
      } catch (e) {
        // Token invalide, on nettoie
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setPatient(null);
    }
  }
  }, []);

  // Récupère le patient dès que le user est défini et que c'est un patient
  useEffect(() => {
    if (user && user.role?.toLowerCase() === "patient" && user.email && user.token) {
      console.log("USEEFFECT patient: récupération patient par email", user.email);
      api.get(`/patients/by-email/${encodeURIComponent(user.email)}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(res => {
          const patientData = res.data;
          console.log("Patient récupéré (useEffect):", patientData);
          setPatient({
            id: patientData.id,
            nom: patientData.nom,
            email: patientData.email,
            numero: patientData.numero,
            sexe: patientData.sexe,
            ville: patientData.ville,
            quartier: patientData.quartier,
            date_naissance: patientData.dateNaissance || "",
            telephone: patientData.telephone || "",
          });
        })
        .catch((err) => {
          console.error("Erreur récupération patient (useEffect):", err);
          setPatient(null);
        });
    } else {
      setPatient(null);
    }
  }, [user]);

  const login = async (email: string, password: string, role: Role) => {
    console.log("LOGIN appelé avec", email, role);
    try {
      const endpoint = role === "patient" ? "/patients/login" : "/auth/login";
      const res = await api.post(endpoint, { email, password, role });
      console.log("Réponse backend login:", res.data);
      const { token, userId, nom, email: userEmail, role: userRole } = res.data;
      const userObj = { id: userId, nom, email: userEmail, role: userRole, token };
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("token", token);
      console.log("LOGIN: avant return");
      return { success: true };
    } catch (error: any) {
      let message = "Erreur de connexion";
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (error.response && error.response.status === 400) {
        message = "Identifiants invalides";
      }
      return { success: false, message };
    }
  }

  const register = async (form: any) => {
    try {
      const res = await api.post("/patients/register", {
        nom: form.nom,
        email: form.email,
        password: form.password,
        numero: form.numero,
        sexe: form.sexe,
        ville: form.ville,
        quartier: form.quartier,
        telephone: form.telephone,
        dateNaissance: form.date_naissance,
      });

      // Stocke le token et l'utilisateur si besoin
      const { token, userId, nom, email, role } = res.data;
      console.log("REGISTER: Token reçu:", token);
      console.log("REGISTER: UserId reçu:", userId);
      
      const userObj = { id: userId, nom, email, role, token };
      setUser(userObj);
      setPatient({
        id: userId,
        nom,
        numero: form.numero,
        sexe: form.sexe,
        ville: form.ville,
        quartier: form.quartier,
        date_naissance: form.date_naissance,
        email,
        telephone: form.telephone,
      });
      
      // Stockage du token dans localStorage
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("token", token);
      console.log("REGISTER: Token stocké dans localStorage:", localStorage.getItem("token"));
      
      // Redirige ou affiche un message de succès si besoin
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      
      // Gestion spécifique des erreurs
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 400) {
        throw new Error("Données invalides. Vérifiez vos informations.");
      } else {
        throw new Error("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    }
  }

  const logout = () => {
    setUser(null)
    setPatient(null)
    setMedecin(null)
    setAdmin(null)
    setEncadreur(null)
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/"; // Forcer le reset complet après logout
  }
  
  const ajouterSymptome = async (symptome: Omit<Symptome, 'id'>) => {
    if (!patient?.id) throw new Error("Patient non connecté");
    
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
    }
    
    console.log("AJOUTER SYMPTOME: Patient ID:", patient.id);
    console.log("AJOUTER SYMPTOME: Token dans localStorage:", token);
    console.log("AJOUTER SYMPTOME: Symptome à ajouter:", symptome);
    
    await api.post(`/patients/${patient.id}/symptomes`, symptome);
  };

  const getSymptomes = async (patientId: string) => {
    const res = await api.get(`/patients/${patientId}/symptomes`);
    return res.data as Symptome[];
  };

  const prendreRendezVous = async (rdv: { medecin_id: string; date: string; heure: string; motif: string }) => {
    if (!patient?.id) throw new Error("Patient non connecté");
    
    // Ne envoyer que les champs nécessaires au backend
    const rendezVousData = {
      medecin_id: rdv.medecin_id,
      date: rdv.date,
      heure: rdv.heure,
      motif: rdv.motif
    };
    
    await api.post(`/patients/${patient.id}/rendezvous`, rendezVousData);
  };

  const getRendezVous = async (patientId: string) => {
    const res = await api.get(`/patients/${patientId}/rendezvous`);
    return res.data as RendezVous[];
  };

  const getPrescriptions = async (patientId: string) => {
    console.log('getPrescriptions: début appel API pour patientId =', patientId);
    const res = await api.get(`/patients/${patientId}/prescriptions`);
    console.log('getPrescriptions: réponse', res.data);
    return res.data as Prescription[];
  }

  // Fonctions pour le planning
  const getPlanning = async () => {
    const res = await api.get('/medecins/planning');
    return res.data as Planning[];
  }

  const getPlanningMedecin = async (medecinId: string) => {
    const res = await api.get(`/medecins/planning/${medecinId}`);
    return res.data as Planning[];
  }

  const creerPlanning = async (planning: Omit<Planning, 'id'>) => {
    await api.post('/medecins/planning', planning);
  }

  const modifierPlanning = async (id: string, planning: Omit<Planning, 'id'>) => {
    await api.put(`/medecins/planning/${id}`, planning);
  }

  const supprimerPlanning = async (id: string) => {
    await api.delete(`/medecins/planning/${id}`);
  }

  const getPlanningDisponibilite = async () => {
    const res = await api.get('/medecins/planning-disponibilite');
    return res.data as Planning[];
  }

  // Fonctions stubs pour les autres fonctionnalités
  const getPatients = async () => {
    const res = await api.get('/admin/patients');
    return res.data as Patient[];
  };

  const searchPatients = async (query: string) => { 
    const res = await api.get(`/medecins/patients/search?query=${encodeURIComponent(query)}`);
    return res.data as Patient[];
  }
  const getSymptomesPatient = async (patientId: string) => { 
    const res = await api.get(`/medecins/patients/${patientId}/symptomes`);
    return res.data as Symptome[];
  }
  const getRendezVousMedecin = async (medecinId: string) => { 
    const res = await api.get(`/medecins/rendezvous/${medecinId}`);
    return res.data as RendezVous[];
  }
  const validerRendezVous = async (rdvId: string, statut: RendezVous['statut'], notes?: string) => {
    await api.put(`/medecins/rendezvous/${rdvId}/statut`, {
      statut,
      notesMedecin: notes
    });
  }
  const ajouterPrescription = async (prescription: Omit<Prescription, 'id'>) => {
    console.log('ajouterPrescription: début appel API');
    await api.post('/medecins/prescriptions', prescription);
    console.log('ajouterPrescription: prescription ajoutée');
  }
  const gererCalendrier = async () => {}
  const ajouterMedecin = async () => {}
  const ajouterEncadreur = async () => {}
  const getMedecins = async () => {
    console.log('getMedecins: début appel API');
    const res = await api.get('/medecins');
    console.log('getMedecins: réponse', res.data);
    return res.data as Medecin[];
  };
  const getEncadreurs = async () => { return [] }
  const rechercherPatient = async () => { return null }
  const getSymptomesPatientEncadreur = async () => { return [] }
  const detecterEpidemie = async () => {}

  const deletePatient = async (patientId: string) => {
    await api.delete(`/admin/patients/${patientId}`);
  };

  // Fonctions pour les alertes épidémiologiques
  const getAlertes = async () => {
    const res = await api.get('/medecins/alertes');
    return res.data as Alerte[];
  };

  const analyserSymptomes = async () => {
    await api.post('/alertes/analyser');
  };

  const resoudreAlerte = async (alerteId: string) => {
    await api.put(`/alertes/${alerteId}/resoudre`);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      patient, 
      medecin, 
      admin, 
      encadreur,
      login, 
      register, 
      logout,
      ajouterSymptome,
      getSymptomes,
      prendreRendezVous,
      getRendezVous,
      getPrescriptions,
      getPatients,
      searchPatients,
      getSymptomesPatient,
      getRendezVousMedecin,
      validerRendezVous,
      ajouterPrescription,
      gererCalendrier,
      ajouterMedecin,
      ajouterEncadreur,
      getMedecins,
      getEncadreurs,
      rechercherPatient,
      getSymptomesPatientEncadreur,
      getAlertes,
      detecterEpidemie,
      getPlanning,
      getPlanningMedecin,
      creerPlanning,
      modifierPlanning,
      supprimerPlanning,
      getPlanningDisponibilite,
      deletePatient,
      analyserSymptomes,
      resoudreAlerte
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  }
  return context
}

// Export des types pour utilisation dans d'autres composants
export type { 
  User, 
  Patient, 
  Medecin, 
  Admin, 
  Encadreur, 
  Symptome, 
  RendezVous, 
  Prescription, 
  Alerte, 
  CalendrierMedecin,
  Role 
}
