"use client"

import React, { useEffect, useState } from "react"
import api from "@/lib/axios"
import { useAuth } from "../context/authcontext"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, Trash2, Eye, Calendar, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

interface Patient {
  id: string
  nom: string
  email: string
  sexe: "M" | "F"
  ville: string
  quartier: string
  telephone: string
  date_naissance: string
  statut: "actif" | "inactif"
}

interface Symptom {
  id: string
  nom: string
  description: string
  gravite: string
  date: string
  heure: string
}

interface Prescription {
  id: string
  patientId: string
  medecinId: string
  description: string
  date: string
  medicaments?: string[]
  posologie?: string
  duree_traitement?: string
}

interface Appointment {
  id: string
  patientId: string
  medecinId: string
  date_rdv: string
  heure: string
  statut: string
  motif?: string
  notesMedecin?: string
  patient?: {
    nom: string
    email: string
  }
}

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

interface Alerte {
  id?: string
  symptome: string
  ville: string
  quartier: string
  nombrePatients: number
  dateDetection: string
  statut: "ACTIVE" | "RESOLVED"
  description?: string
}

export default function MedecinPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [patients, setPatients] = useState<Patient[]>([])
  const [symptomes, setSymptomes] = useState<Symptom[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSymptomes, setPatientSymptomes] = useState<Symptom[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // État pour la recherche
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [symptomeEnEdition, setSymptomeEnEdition] = useState<Symptom | null>(null)
  const [nouveauSymptome, setNouveauSymptome] = useState({
    nom: "",
    description: "",
    gravite: "",
  })

  // États pour les rendez-vous
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointmentAction, setAppointmentAction] = useState<{
    statut: string
    nouvelleDate?: string
    nouvelleHeure?: string
    notesMedecin?: string
  }>({
    statut: "CONFIRME"
  })

  // États pour les prescriptions
  const [nouvellePrescription, setNouvellePrescription] = useState({
    patientId: "",
    description: "",
    medicaments: "",
    posologie: "",
    duree_traitement: ""
  })

  // États pour le planning
  const [plannings, setPlannings] = useState<Planning[]>([])
  const [nouveauPlanning, setNouveauPlanning] = useState({
    medecinId: "",
    jour: "",
    heureDebut: "",
    heureFin: "",
    disponible: true,
    notes: ""
  })
  const [planningEnEdition, setPlanningEnEdition] = useState<Planning | null>(null)

  // États pour les alertes épidémiologiques
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loadingAlertes, setLoadingAlertes] = useState(false)

  // Badge rouge clignotant si au moins une alerte active
  const hasActiveAlert = alertes.some(a => a.statut === "ACTIVE")
  // Badge vert clignotant si au moins un rendez-vous en attente (insensible à la casse)
  const hasNewRdv = appointments.some(rdv => rdv.statut?.toLowerCase() === "en_attente")

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    if (user.role?.toLowerCase() !== "medecin") {
      router.push("/")
      return
    }
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log("[MedecinPage] user.id =", user.id)
        console.log("[MedecinPage] user.email =", user.email)
        
        // D'abord récupérer l'ID correct du médecin
        const medecinRes = await api.get(`/medecins/me?email=${encodeURIComponent(user.email)}`)
        const medecinId = medecinRes.data.id
        console.log("[MedecinPage] Médecin ID correct:", medecinId)
        
        const [patientsRes, symptomesRes, prescriptionsRes, rdvsRes] = await Promise.all([
          api.get("/medecins/patients"),
          api.get("/medecins/symptomes"),
          api.get("/medecins/prescriptions"),
          api.get(`/medecins/rendezvous/${medecinId}`),
        ])

        console.log("[MedecinPage] Rendez-vous reçus:", rdvsRes.data)
        setPatients(patientsRes.data)
        setSymptomes(symptomesRes.data)
        setPrescriptions(prescriptionsRes.data)
        setAppointments(rdvsRes.data)
        
        // Charger le planning
        await chargerPlanning()
        
        setError(null)
      } catch (err) {
        console.error("Erreur chargement données médecin :", err)
        setError("Erreur lors du chargement des données.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, router])

  // Voir les symptômes d'un patient
  const voirSymptomesPatient = async (patient: Patient) => {
    try {
      const res = await api.get(`/medecins/patients/${patient.id}/symptomes`)
      setPatientSymptomes(res.data)
      setSelectedPatient(patient)
    } catch (err) {
      console.error("Erreur chargement symptômes patient :", err)
      alert("Erreur lors du chargement des symptômes")
    }
  }

  // Rechercher des patients
  const rechercherPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const res = await api.get(`/medecins/patients/search?query=${encodeURIComponent(query)}`)
      setSearchResults(res.data)
    } catch (err) {
      console.error("Erreur recherche patients :", err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Gérer un rendez-vous
  const gererRendezVous = async () => {
    if (!selectedAppointment || !user) return

    try {
      // Récupérer l'ID correct du médecin
      const medecinRes = await api.get(`/medecins/me?email=${encodeURIComponent(user.email)}`)
      const medecinId = medecinRes.data.id
      
      await api.put(`/medecins/rendezvous/${selectedAppointment.id}/statut`, appointmentAction)
      
      // Mettre à jour la liste des rendez-vous
      const res = await api.get(`/medecins/rendezvous/${medecinId}`)
      setAppointments(res.data)
      
      setSelectedAppointment(null)
      setAppointmentAction({ statut: "CONFIRME" })
      alert("Rendez-vous mis à jour avec succès")
    } catch (err) {
      console.error("Erreur mise à jour rendez-vous :", err)
      alert("Erreur lors de la mise à jour")
    }
  }

  // Créer une prescription
  const creerPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouvellePrescription.patientId || !nouvellePrescription.description || !user) {
      alert("Patient et description sont obligatoires")
      return
    }

    try {
      // Récupérer l'ID du médecin connecté
      const medecinResponse = await api.get(`/medecins/me?email=${user.email}`)
      const medecinId = medecinResponse.data.id

      const prescriptionData = {
        patientId: nouvellePrescription.patientId,
        medecinId: medecinId.toString(),
        description: nouvellePrescription.description,
        medicaments: nouvellePrescription.medicaments || "",
        posologie: nouvellePrescription.posologie || "",
        duree_traitement: nouvellePrescription.duree_traitement || "",
        date: new Date().toISOString().split('T')[0],
        heure: new Date().toTimeString().split(' ')[0]
      }

      console.log("Données prescription envoyées:", prescriptionData)

      const res = await api.post("/medecins/prescriptions", prescriptionData)
      console.log("Réponse prescription:", res.data)
      
      setPrescriptions([...prescriptions, res.data])
      setNouvellePrescription({
        patientId: "",
        description: "",
        medicaments: "",
        posologie: "",
        duree_traitement: ""
      })
      alert("Prescription créée avec succès")
    } catch (err) {
      console.error("Erreur création prescription :", err)
      alert("Erreur lors de la création de la prescription")
    }
  }

  // Ajouter symptôme
  const ajouterSymptome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouveauSymptome.nom || !nouveauSymptome.gravite) {
      alert("Nom et gravité sont obligatoires")
      return
    }

    try {
      const res = await api.post("/medecins/symptomes", nouveauSymptome)
      setSymptomes([...symptomes, res.data])
      setNouveauSymptome({ nom: "", description: "", gravite: "" })
      alert("Symptôme ajouté")
    } catch (err) {
      console.error("Erreur ajout symptôme :", err)
      alert("Erreur lors de l'ajout")
    }
  }

  // Modifier symptôme
  const modifierSymptome = async (symptome: Symptom) => {
    if (!symptome.nom || !symptome.gravite) {
      alert("Nom et gravité sont obligatoires")
      return
    }
    try {
      const res = await api.put(`/medecins/symptomes/${symptome.id}`, symptome)
      setSymptomes(symptomes.map((s) => (s.id === symptome.id ? res.data : s)))
      setSymptomeEnEdition(null)
      alert("Symptôme modifié")
    } catch (err) {
      console.error("Erreur modification symptôme :", err)
      alert("Erreur lors de la modification")
    }
  }

  // Supprimer symptôme
  const supprimerSymptome = async (id: string) => {
    if (!confirm("Confirmer la suppression du symptôme ?")) return
    try {
      await api.delete(`/medecins/symptomes/${id}`)
      setSymptomes(symptomes.filter((s) => s.id !== id))
      alert("Symptôme supprimé")
    } catch (err) {
      console.error("Erreur suppression symptôme :", err)
      alert("Erreur lors de la suppression")
    }
  }

  // Fonctions pour le planning
  const chargerPlanning = async () => {
    if (!user) return
    
    try {
      const medecinRes = await api.get(`/medecins/me?email=${encodeURIComponent(user.email)}`)
      const medecinId = medecinRes.data.id
      const res = await api.get(`/medecins/planning/${medecinId}`)
      setPlannings(res.data)
    } catch (err) {
      console.error("Erreur chargement planning :", err)
    }
  }

  const creerPlanning = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouveauPlanning.jour || !nouveauPlanning.heureDebut || !nouveauPlanning.heureFin) {
      alert("Jour, heure début et heure fin sont obligatoires")
      return
    }

    if (!user) {
      alert("Utilisateur non connecté")
      return
    }

    try {
      const medecinRes = await api.get(`/medecins/me?email=${encodeURIComponent(user.email)}`)
      const medecinId = medecinRes.data.id

      const planningData = {
        medecinId: medecinId,
        jour: nouveauPlanning.jour,
        heureDebut: nouveauPlanning.heureDebut,
        heureFin: nouveauPlanning.heureFin,
        disponible: nouveauPlanning.disponible,
        notes: nouveauPlanning.notes
      }

      await api.post("/medecins/planning", planningData)
      await chargerPlanning()
      setNouveauPlanning({
        medecinId: "",
        jour: "",
        heureDebut: "",
        heureFin: "",
        disponible: true,
        notes: ""
      })
      alert("Planning créé avec succès")
    } catch (err) {
      console.error("Erreur création planning :", err)
      alert("Erreur lors de la création")
    }
  }

  const modifierPlanning = async (planning: Planning) => {
    try {
      await api.put(`/medecins/planning/${planning.id}`, {
        medecinId: planning.medecinId,
        jour: planning.jour,
        heureDebut: planning.heureDebut,
        heureFin: planning.heureFin,
        disponible: planning.disponible,
        notes: planning.notes
      })
      await chargerPlanning()
      setPlanningEnEdition(null)
      alert("Planning modifié avec succès")
    } catch (err) {
      console.error("Erreur modification planning :", err)
      alert("Erreur lors de la modification")
    }
  }

  const supprimerPlanning = async (id: string) => {
    if (!confirm("Confirmer la suppression du planning ?")) return
    try {
      await api.delete(`/medecins/planning/${id}`)
      await chargerPlanning()
      alert("Planning supprimé")
    } catch (err) {
      console.error("Erreur suppression planning :", err)
      alert("Erreur lors de la suppression")
    }
  }

  // Fonctions pour les alertes épidémiologiques
  const chargerAlertes = async () => {
    try {
      setLoadingAlertes(true)
      const res = await api.get('/medecins/alertes')
      setAlertes(res.data)
    } catch (err) {
      console.error("Erreur chargement alertes :", err)
    } finally {
      setLoadingAlertes(false)
    }
  }

  const analyserSymptomes = async () => {
    try {
      await api.post('/alertes/analyser')
      await chargerAlertes()
      alert("Analyse épidémiologique terminée")
    } catch (err) {
      console.error("Erreur analyse épidémiologique :", err)
      alert("Erreur lors de l'analyse")
    }
  }

  const resoudreAlerte = async (alerteId: string) => {
    if (!confirm("Confirmer la résolution de cette alerte ?")) return
    try {
      await api.put(`/alertes/${alerteId}/resoudre`)
      await chargerAlertes()
      alert("Alerte résolue")
    } catch (err) {
      console.error("Erreur résolution alerte :", err)
      alert("Erreur lors de la résolution")
    }
  }

  useEffect(() => {
    chargerPlanning()
    chargerAlertes()
  }, [])

  if (!user) return <div>Chargement...</div>
  if (user.role?.toLowerCase() !== "medecin") return <div>Accès interdit</div>
  if (loading) return <div>Chargement des données...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 1. HEADER MODERNISÉ */}
      <header className="backdrop-blur-md bg-white/60 border-b border-slate-200 shadow-lg animate-fade-in sticky top-0 z-50 mb-8 flex justify-between items-center px-4 py-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-md animate-pop-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2zm2 4h4" /></svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent animate-gradient-text">Bienvenue Dr. {user.nom}</h1>
        </div>
        <Button variant="outline" onClick={logout} className="ml-2 transition-transform hover:scale-105 focus:ring-2 focus:ring-blue-400">
          Déconnexion
        </Button>
      </header>

      {/* 2. TABS MODERNISÉS */}
      <Tabs defaultValue="patients" className="space-y-8 animate-fade-in">
        <TabsList className="grid w-full grid-cols-6 bg-white/70 backdrop-blur-md rounded-xl shadow-md">
          <TabsTrigger value="patients" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-green-400">
            <span>Patients</span>
          </TabsTrigger>
          <TabsTrigger value="rendezvous" className="flex items-center space-x-2 relative transition-all hover:scale-105 focus:ring-2 focus:ring-green-400">
            <span>Rendez-vous</span>
            {hasNewRdv && (
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-green-400">
            <span>Prescriptions</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-green-400">
            <span>Planning</span>
          </TabsTrigger>
          <TabsTrigger value="alertes" className="flex items-center space-x-2 relative transition-all hover:scale-105 focus:ring-2 focus:ring-green-400">
            <span>Alertes</span>
            {hasActiveAlert && (
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-green-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
            <CardHeader>
              <CardTitle>Rechercher et consulter les patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Barre de recherche */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value.trim()) {
                        rechercherPatients(e.target.value)
                      } else {
                        setSearchResults([])
                      }
                    }}
                    className="rounded-xl border-2 border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                        <Button
                          variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                        >
                    Effacer
                        </Button>
                      </div>

                {/* Résultats de recherche */}
                {searchQuery && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-600">
                      Résultats de recherche ({searchResults.length})
                    </h3>
                    {isSearching && <p className="text-sm text-gray-500">Recherche en cours...</p>}
                    {!isSearching && searchResults.length === 0 && (
                      <p className="text-sm text-gray-500">Aucun patient trouvé</p>
                    )}
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 border rounded-md bg-blue-50 flex justify-between items-center"
                    >
                      <div>
                          <p className="font-semibold">{patient.nom}</p>
                          <p className="text-sm">{patient.email}</p>
                          <p className="text-sm">
                            {patient.ville} - {patient.quartier}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <Badge variant={patient.statut === "actif" ? "default" : "secondary"} className={patient.statut === "actif" ? "animate-pulse bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {patient.statut}
                          </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                            onClick={() => voirSymptomesPatient(patient)}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Symptômes
                        </Button>
                        </div>
                      </div>
                    ))}
                    </div>
                )}

                {/* Liste complète des patients */}
                {!searchQuery && (
                  <>
                    <h3 className="font-semibold text-sm text-gray-600">
                      Tous les patients ({patients.length})
                    </h3>
              {patients.length === 0 ? (
                <p>Aucun patient trouvé</p>
              ) : (
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 border rounded-md bg-white flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">{patient.nom}</p>
                        <p className="text-sm">{patient.email}</p>
                        <p className="text-sm">
                          {patient.ville} - {patient.quartier}
                        </p>
                        <p className="text-sm">{patient.telephone}</p>
                      </div>
                            <div className="flex gap-2">
                      <Badge variant={patient.statut === "actif" ? "default" : "secondary"} className={patient.statut === "actif" ? "animate-pulse bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {patient.statut}
                      </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => voirSymptomesPatient(patient)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Symptômes
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dialog pour voir les symptômes d'un patient */}
          <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Symptômes de {selectedPatient?.nom}</DialogTitle>
                <DialogDescription>
                  Liste des symptômes enregistrés par ce patient
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {patientSymptomes.length === 0 ? (
                  <p className="text-gray-500">Aucun symptôme enregistré</p>
                ) : (
                  <div className="space-y-3">
                    {patientSymptomes.map((symptome) => (
                      <div key={symptome.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{symptome.nom}</p>
                            <p className="text-sm text-gray-600">{symptome.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(symptome.date).toLocaleDateString("fr-FR")} à {symptome.heure}
                            </p>
                          </div>
                          <Badge variant="outline">{symptome.gravite}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="rendezvous">
          <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-green-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
            <CardHeader>
              <CardTitle>Rendez-vous reçus</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p>Aucun rendez-vous</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((rdv) => (
                    <div
                      key={rdv.id}
                      className="p-4 border rounded-md bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{rdv.patient?.nom || "Patient"}</p>
                          <p className="text-sm">{rdv.patient?.email}</p>
                          <p className="text-sm">
                            {new Date(rdv.date_rdv).toLocaleDateString("fr-FR")} à {rdv.heure}
                          </p>
                          {rdv.motif && <p className="text-sm text-gray-600">Motif: {rdv.motif}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            rdv.statut === "CONFIRME" ? "default" :
                            rdv.statut === "ANNULE" ? "destructive" :
                            rdv.statut === "REPORTE" ? "secondary" : "outline"
                          }>
                            {rdv.statut}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAppointment(rdv)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Gérer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog pour gérer un rendez-vous */}
          <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gérer le rendez-vous</DialogTitle>
                <DialogDescription>
                  {selectedAppointment?.patient?.nom} - {new Date(selectedAppointment?.date_rdv || "").toLocaleDateString("fr-FR")} à {selectedAppointment?.heure}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Action</Label>
                  <Select
                    value={appointmentAction.statut}
                    onValueChange={(value) => setAppointmentAction({...appointmentAction, statut: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONFIRME">Confirmer</SelectItem>
                      <SelectItem value="ANNULE">Annuler</SelectItem>
                      <SelectItem value="REPORTE">Reporter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {appointmentAction.statut === "REPORTE" && (
                  <>
                    <div>
                      <Label>Nouvelle date</Label>
                      <Input
                        type="date"
                        value={appointmentAction.nouvelleDate || ""}
                        onChange={(e) => setAppointmentAction({...appointmentAction, nouvelleDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Nouvelle heure</Label>
                      <Input
                        type="time"
                        value={appointmentAction.nouvelleHeure || ""}
                        onChange={(e) => setAppointmentAction({...appointmentAction, nouvelleHeure: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Notes du médecin</Label>
                  <Textarea
                    value={appointmentAction.notesMedecin || ""}
                    onChange={(e) => setAppointmentAction({...appointmentAction, notesMedecin: e.target.value})}
                    placeholder="Notes optionnelles..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                  Annuler
                </Button>
                <Button onClick={gererRendezVous}>
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-green-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
            <CardHeader>
              <CardTitle>Créer une prescription</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={creerPrescription} className="space-y-4">
                <div>
                  <Label>Patient</Label>
                  <Select
                    value={String(nouvellePrescription.patientId)}
                    onValueChange={(value) => {
                      setNouvellePrescription({...nouvellePrescription, patientId: String(value)})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={String(patient.id)} value={String(patient.id)}>
                          {patient.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={nouvellePrescription.description}
                    onChange={(e) => setNouvellePrescription({...nouvellePrescription, description: e.target.value})}
                    placeholder="Description de la prescription..."
                    required
                  />
                </div>
                <div>
                  <Label>Médicaments</Label>
                  <Input
                    value={nouvellePrescription.medicaments}
                    onChange={(e) => setNouvellePrescription({...nouvellePrescription, medicaments: e.target.value})}
                    placeholder="Ex: Paracétamol, Ibuprofène, Vitamine C (séparés par des virgules)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Séparez les médicaments par des virgules
                  </p>
                </div>
                <div>
                  <Label>Posologie</Label>
                  <Input
                    value={nouvellePrescription.posologie}
                    onChange={(e) => setNouvellePrescription({...nouvellePrescription, posologie: e.target.value})}
                    placeholder="Posologie..."
                  />
                </div>
                <div>
                  <Label>Durée du traitement</Label>
                  <Input
                    value={nouvellePrescription.duree_traitement}
                    onChange={(e) => setNouvellePrescription({...nouvellePrescription, duree_traitement: e.target.value})}
                    placeholder="Ex: 7 jours"
                  />
                </div>
                <Button type="submit" className="rounded-xl shadow-md bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold transition-transform hover:scale-105 focus:ring-2 focus:ring-green-400">Créer la prescription</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Prescriptions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p>Aucune prescription</p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((presc) => (
                    <div
                      key={presc.id}
                      className="p-4 border rounded-md bg-white"
                    >
                      <p className="font-semibold">{presc.description}</p>
                      {presc.medicaments && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Médicaments:</p>
                          {Array.isArray(presc.medicaments) ? (
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {presc.medicaments.map((med, index) => (
                                <li key={index}>{med}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-600">{presc.medicaments}</p>
                          )}
                        </div>
                      )}
                      {presc.posologie && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Posologie:</p>
                          <p className="text-sm text-gray-600">{presc.posologie}</p>
                        </div>
                      )}
                      {presc.duree_traitement && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Durée:</p>
                          <p className="text-sm text-gray-600">{presc.duree_traitement}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Date : {new Date(presc.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning">
          <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-green-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
            <CardHeader>
              <CardTitle>Gérer mon planning de disponibilité</CardTitle>
              <CardDescription>
                Définissez vos horaires de disponibilité pour la semaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={creerPlanning} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Jour de la semaine</Label>
                    <Select
                      value={nouveauPlanning.jour}
                      onValueChange={(value) => setNouveauPlanning({...nouveauPlanning, jour: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un jour" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONDAY">Lundi</SelectItem>
                        <SelectItem value="TUESDAY">Mardi</SelectItem>
                        <SelectItem value="WEDNESDAY">Mercredi</SelectItem>
                        <SelectItem value="THURSDAY">Jeudi</SelectItem>
                        <SelectItem value="FRIDAY">Vendredi</SelectItem>
                        <SelectItem value="SATURDAY">Samedi</SelectItem>
                        <SelectItem value="SUNDAY">Dimanche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Heure de début</Label>
                    <Input
                      type="time"
                      value={nouveauPlanning.heureDebut}
                      onChange={(e) => setNouveauPlanning({...nouveauPlanning, heureDebut: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Heure de fin</Label>
                    <Input
                      type="time"
                      value={nouveauPlanning.heureFin}
                      onChange={(e) => setNouveauPlanning({...nouveauPlanning, heureFin: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={nouveauPlanning.disponible}
                    onChange={(e) => setNouveauPlanning({...nouveauPlanning, disponible: e.target.checked})}
                  />
                  <Label htmlFor="disponible">Disponible</Label>
                </div>
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={nouveauPlanning.notes}
                    onChange={(e) => setNouveauPlanning({...nouveauPlanning, notes: e.target.value})}
                    placeholder="Notes sur cette plage horaire..."
                  />
                </div>
                <Button type="submit" className="rounded-xl shadow-md bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold transition-transform hover:scale-105 focus:ring-2 focus:ring-green-400">Ajouter au planning</Button>
              </form>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Mon planning actuel</h3>
                {plannings.length === 0 ? (
                  <p className="text-gray-500">Aucun planning défini</p>
                ) : (
                  <div className="space-y-4">
                    {plannings.map((planning) => (
                      <div
                        key={planning.id}
                        className="p-4 border rounded-md bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {planning.jour === "MONDAY" && "Lundi"}
                              {planning.jour === "TUESDAY" && "Mardi"}
                              {planning.jour === "WEDNESDAY" && "Mercredi"}
                              {planning.jour === "THURSDAY" && "Jeudi"}
                              {planning.jour === "FRIDAY" && "Vendredi"}
                              {planning.jour === "SATURDAY" && "Samedi"}
                              {planning.jour === "SUNDAY" && "Dimanche"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {planning.heureDebut} - {planning.heureFin}
                            </p>
                            <Badge variant={planning.disponible ? "default" : "secondary"}>
                              {planning.disponible ? "Disponible" : "Indisponible"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPlanningEnEdition(planning)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => supprimerPlanning(planning.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {planning.notes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600">{planning.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertes">
          <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-green-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
            <CardHeader>
              <CardTitle>Alertes épidémiologiques</CardTitle>
              <CardDescription>
                Surveillez et gérez les alertes épidémiologiques détectées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bouton pour déclencher l'analyse épidémiologique */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Analyse épidémiologique</h3>
                    <p className="text-sm text-gray-600">
                      Déclenchez une analyse pour détecter les épidémies potentielles (seuil : 5 patients minimum)
                    </p>
                  </div>
                  <Button 
                    onClick={analyserSymptomes}
                    disabled={loadingAlertes}
                    className="rounded-xl shadow-md bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold transition-transform hover:scale-105 focus:ring-2 focus:ring-red-400"
                  >
                    {loadingAlertes ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyse en cours...
                      </div>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Analyser les symptômes
                      </>
                    )}
                  </Button>
                </div>

                {/* Liste des alertes actives */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Alertes actives ({alertes.filter(a => a.statut === "ACTIVE").length})
                  </h3>
                  {loadingAlertes ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : alertes.filter(a => a.statut === "ACTIVE").length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Aucune alerte active</p>
                      <p className="text-sm">Cliquez sur "Analyser les symptômes" pour détecter les épidémies</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alertes
                        .filter(alerte => alerte.statut === "ACTIVE")
                        .map((alerte) => (
                          <div
                            key={alerte.id}
                            className="p-4 border border-red-200 rounded-md bg-red-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                  <h4 className="font-semibold text-red-800">
                                    Épidémie détectée
                                  </h4>
                                  <Badge variant="destructive">
                                    {alerte.nombrePatients} patients
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Symptôme:</strong> {alerte.symptome}
                                </p>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Localisation:</strong> {alerte.ville}, {alerte.quartier}
                                </p>
                                {alerte.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {alerte.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Détecté le {new Date(alerte.dateDetection).toLocaleDateString("fr-FR")} à {new Date(alerte.dateDetection).toLocaleTimeString("fr-FR")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resoudreAlerte(alerte.id!)}
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Résoudre
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Historique des alertes résolues */}
                {alertes.filter(a => a.statut === "RESOLVED").length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Alertes résolues ({alertes.filter(a => a.statut === "RESOLVED").length})
                    </h3>
                    <div className="space-y-4">
                      {alertes
                        .filter(alerte => alerte.statut === "RESOLVED")
                        .map((alerte) => (
                          <div
                            key={alerte.id}
                            className="p-4 border border-gray-200 rounded-md bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <h4 className="font-semibold text-gray-800">
                                    Alerte résolue
                                  </h4>
                                  <Badge variant="secondary">
                                    {alerte.nombrePatients} patients
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Symptôme:</strong> {alerte.symptome}
                                </p>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Localisation:</strong> {alerte.ville}, {alerte.quartier}
                                </p>
                                {alerte.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {alerte.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Détecté le {new Date(alerte.dateDetection).toLocaleDateString("fr-FR")} à {new Date(alerte.dateDetection).toLocaleTimeString("fr-FR")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
