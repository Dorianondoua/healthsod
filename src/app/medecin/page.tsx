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
import { Activity, Edit, Trash2, Eye, Calendar, FileText, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react"

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

  // Ã‰tat pour la recherche
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [symptomeEnEdition, setSymptomeEnEdition] = useState<Symptom | null>(null)
  const [nouveauSymptome, setNouveauSymptome] = useState({
    nom: "",
    description: "",
    gravite: "",
  })

  // Ã‰tats pour les rendez-vous
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointmentAction, setAppointmentAction] = useState<{
    statut: string
    nouvelleDate?: string
    nouvelleHeure?: string
    notesMedecin?: string
  }>({
    statut: "CONFIRME"
  })

  // Ã‰tats pour les prescriptions
  const [nouvellePrescription, setNouvellePrescription] = useState({
    patientId: "",
    description: "",
    medicaments: "",
    posologie: "",
    duree_traitement: ""
  })

  // Ã‰tats pour le planning
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

  // Ã‰tats pour les alertes Ã©pidÃ©miologiques
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loadingAlertes, setLoadingAlertes] = useState(false)

  // Badge rouge clignotant si au moins une alerte active
  const hasActiveAlert = alertes.some(a => a.statut === "ACTIVE")
  // Badge vert clignotant si au moins un rendez-vous en attente (insensible Ã  la casse)
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
        
        // D'abord rÃ©cupÃ©rer l'ID correct du mÃ©decin
        const medecinRes = await api.get(`/medecins/me?email=${encodeURIComponent(user.email)}`)
        const medecinId = medecinRes.data.id
        console.log("[MedecinPage] MÃ©decin ID correct:", medecinId)
        
        const [patientsRes, symptomesRes, prescriptionsRes, rdvsRes] = await Promise.all([
          api.get("/medecins/patients"),
          api.get("/medecins/symptomes"),
          api.get("/medecins/prescriptions"),
          api.get(`/medecins/rendezvous/${medecinId}`),
        ])

        console.log("[MedecinPage] Rendez-vous reÃ§us:", rdvsRes.data)
        setPatients(patientsRes.data)
        setSymptomes(symptomesRes.data)
        setPrescriptions(prescriptionsRes.data)
        setAppointments(rdvsRes.data)
        
        // Charger le planning
        await chargerPlanning()
        
        setError(null)
      } catch (err) {
        console.error("Erreur chargement donnÃ©es mÃ©decin :", err)
        setError("Erreur lors du chargement des donnÃ©es.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, router])

  // Voir les symptÃ´mes d'un patient
  const voirSymptomesPatient = async (patient: Patient) => {
    try {
      const res = await api.get(`/medecins/patients/${patient.id}/symptomes`)
      setPatientSymptomes(res.data)
      setSelectedPatient(patient)
    } catch (err) {
      console.error("Erreur chargement symptÃ´mes patient :", err)
      alert("Erreur lors du chargement des symptÃ´mes")
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

  // GÃ©rer un rendez-vous
  const gererRendezVous = async () => {
    if (!selectedAppointment || !user) return

    try {
      // RÃ©cupÃ©rer l'ID correct du mÃ©decin
      const medecinRes = await api.get(`/medecins/me?email=${encodeURIComponent(user.email)}`)
      const medecinId = medecinRes.data.id
      
      await api.put(`/medecins/rendezvous/${selectedAppointment.id}/statut`, appointmentAction)
      
      // Mettre Ã  jour la liste des rendez-vous
      const res = await api.get(`/medecins/rendezvous/${medecinId}`)
      setAppointments(res.data)
      
      setSelectedAppointment(null)
      setAppointmentAction({ statut: "CONFIRME" })
      alert("Rendez-vous mis Ã  jour avec succÃ¨s")
    } catch (err) {
      console.error("Erreur mise Ã  jour rendez-vous :", err)
      alert("Erreur lors de la mise Ã  jour")
    }
  }

  // CrÃ©er une prescription
  const creerPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouvellePrescription.patientId || !nouvellePrescription.description || !user) {
      alert("Patient et description sont obligatoires")
      return
    }

    try {
      // RÃ©cupÃ©rer l'ID du mÃ©decin connectÃ©
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

      console.log("DonnÃ©es prescription envoyÃ©es:", prescriptionData)

      const res = await api.post("/medecins/prescriptions", prescriptionData)
      console.log("RÃ©ponse prescription:", res.data)
      
      setPrescriptions([...prescriptions, res.data])
      setNouvellePrescription({
        patientId: "",
        description: "",
        medicaments: "",
        posologie: "",
        duree_traitement: ""
      })
      alert("Prescription crÃ©Ã©e avec succÃ¨s")
    } catch (err) {
      console.error("Erreur crÃ©ation prescription :", err)
      alert("Erreur lors de la crÃ©ation de la prescription")
    }
  }

  // Ajouter symptÃ´me
  const ajouterSymptome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouveauSymptome.nom || !nouveauSymptome.gravite) {
      alert("Nom et gravitÃ© sont obligatoires")
      return
    }

    try {
      const res = await api.post("/medecins/symptomes", nouveauSymptome)
      setSymptomes([...symptomes, res.data])
      setNouveauSymptome({ nom: "", description: "", gravite: "" })
      alert("SymptÃ´me ajoutÃ©")
    } catch (err) {
      console.error("Erreur ajout symptÃ´me :", err)
      alert("Erreur lors de l'ajout")
    }
  }

  // Modifier symptÃ´me
  const modifierSymptome = async (symptome: Symptom) => {
    if (!symptome.nom || !symptome.gravite) {
      alert("Nom et gravitÃ© sont obligatoires")
      return
    }
    try {
      const res = await api.put(`/medecins/symptomes/${symptome.id}`, symptome)
      setSymptomes(symptomes.map((s) => (s.id === symptome.id ? res.data : s)))
      setSymptomeEnEdition(null)
      alert("SymptÃ´me modifiÃ©")
    } catch (err) {
      console.error("Erreur modification symptÃ´me :", err)
      alert("Erreur lors de la modification")
    }
  }

  // Supprimer symptÃ´me
  const supprimerSymptome = async (id: string) => {
    if (!confirm("Confirmer la suppression du symptÃ´me ?")) return
    try {
      await api.delete(`/medecins/symptomes/${id}`)
      setSymptomes(symptomes.filter((s) => s.id !== id))
      alert("SymptÃ´me supprimÃ©")
    } catch (err) {
      console.error("Erreur suppression symptÃ´me :", err)
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
      alert("Jour, heure dÃ©but et heure fin sont obligatoires")
      return
    }

    if (!user) {
      alert("Utilisateur non connectÃ©")
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
      alert("Planning crÃ©Ã© avec succÃ¨s")
    } catch (err) {
      console.error("Erreur crÃ©ation planning :", err)
      alert("Erreur lors de la crÃ©ation")
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
      alert("Planning modifiÃ© avec succÃ¨s")
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
      alert("Planning supprimÃ©")
    } catch (err) {
      console.error("Erreur suppression planning :", err)
      alert("Erreur lors de la suppression")
    }
  }

  // Fonctions pour les alertes Ã©pidÃ©miologiques
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
      alert("Analyse Ã©pidÃ©miologique terminÃ©e")
    } catch (err) {
      console.error("Erreur analyse Ã©pidÃ©miologique :", err)
      alert("Erreur lors de l'analyse")
    }
  }

  const resoudreAlerte = async (alerteId: string) => {
    if (!confirm("Confirmer la rÃ©solution de cette alerte ?")) return
    try {
      await api.put(`/alertes/${alerteId}/resoudre`)
      await chargerAlertes()
      alert("Alerte rÃ©solue")
    } catch (err) {
      console.error("Erreur rÃ©solution alerte :", err)
      alert("Erreur lors de la rÃ©solution")
    }
  }

  useEffect(() => {
    chargerPlanning()
    chargerAlertes()
  }, [])

  if (!user) return <div>Chargement...</div>
  if (user.role?.toLowerCase() !== "medecin") return <div>AccÃ¨s interdit</div>
  if (loading) return <div>Chargement des donnÃ©es...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="premium-page">
      <Tabs defaultValue="patients" className="space-y-8">
        <header className="premium-nav">
          <div className="premium-brand">
            <div className="premium-brand-icon">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="premium-wordmark">Health<span className="premium-wordmark-accent">SOD</span></span>
              <span className="premium-kicker">Espace Médecin</span>
              <p className="mt-1 text-sm font-medium text-slate-600">Dr. {user.nom}</p>
            </div>
          </div>

            <TabsList className="premium-tabs grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="patients" className="premium-tab">
                Patients
              </TabsTrigger>
              <TabsTrigger value="rendezvous" className="premium-tab relative">
                Rendez-vous
            {hasNewRdv && (
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="premium-tab">
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="planning" className="premium-tab">
            Planning
          </TabsTrigger>
          <TabsTrigger value="alertes" className="premium-tab relative">
            Alertes
            {hasActiveAlert && (
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

            <Button onClick={logout} className="premium-button h-12 px-6">
              Déconnexion
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </header>

        <TabsContent value="patients">
          <Card className="premium-card">
            <CardHeader>
              <p className="ds-section-kicker">Dossiers patients</p>
              <CardTitle className="ds-section-title">Rechercher et consulter les patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                    className="rounded-xl border-1.5 border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all h-11"
                  />
                  <Button variant="outline" className="rounded-xl h-11"
                    onClick={() => { setSearchQuery(""); setSearchResults([]) }}>
                    Effacer
                  </Button>
                </div>

                {searchQuery && (
                  <div className="space-y-2">
                    <p className="ds-section-kicker">Résultats ({searchResults.length})</p>
                    {isSearching && (
                      <div className="ds-empty">
                        <div className="ds-skeleton h-4 w-40 rounded" />
                        <div className="ds-skeleton h-4 w-32 rounded" />
                      </div>
                    )}
                    {!isSearching && searchResults.length === 0 && (
                      <div className="ds-empty">
                        <div className="ds-empty-icon"><Eye className="h-5 w-5" /></div>
                        <p className="ds-empty-title">Aucun patient trouvé</p>
                        <p className="ds-empty-body">Essayez avec un autre nom ou email.</p>
                      </div>
                    )}
                    {searchResults.map((patient) => (
                      <div key={patient.id} className="ds-row">
                        <div>
                          <p className="ds-row-name">{patient.nom}</p>
                          <p className="ds-row-meta">{patient.ville}, {patient.quartier}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`ds-badge ${patient.statut === "actif" ? "ds-badge-ok" : "ds-badge-neutral"}`}>
                            <span className="ds-badge-dot" />
                            {patient.statut}
                          </span>
                          <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs"
                            onClick={() => voirSymptomesPatient(patient)}>
                            <Eye className="h-3.5 w-3.5 mr-1.5" />Symptômes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!searchQuery && (
                  <>
                    <p className="ds-section-kicker">Tous les patients ({patients.length})</p>
                    {patients.length === 0 ? (
                      <div className="ds-empty">
                        <div className="ds-empty-icon"><FileText className="h-5 w-5" /></div>
                        <p className="ds-empty-title">Aucun patient enregistré</p>
                        <p className="ds-empty-body">Les patients apparaîtront ici une fois inscrits sur la plateforme.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {patients.map((patient) => (
                          <div key={patient.id} className="ds-row">
                            <div>
                              <p className="ds-row-name">{patient.nom}</p>
                              <p className="ds-row-meta">{patient.ville}, {patient.quartier}</p>
                              <p className="ds-row-meta">{patient.telephone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`ds-badge ${patient.statut === "actif" ? "ds-badge-ok" : "ds-badge-neutral"}`}>
                                <span className="ds-badge-dot" />
                                {patient.statut}
                              </span>
                              <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs"
                                onClick={() => voirSymptomesPatient(patient)}>
                                <Eye className="h-3.5 w-3.5 mr-1.5" />Symptômes
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

          {/* Dialog pour voir les symptÃ´mes d'un patient */}
          <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>SymptÃ´mes de {selectedPatient?.nom}</DialogTitle>
                <DialogDescription>
                  Liste des symptÃ´mes enregistrÃ©s par ce patient
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {patientSymptomes.length === 0 ? (
                  <p className="ds-empty-body">Aucun symptÃ´me enregistrÃ©</p>
                ) : (
                  <div className="space-y-3">
                    {patientSymptomes.map((symptome) => (
                      <div key={symptome.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="ds-row-name">{symptome.nom}</p>
                            <p className="text-sm text-gray-600">{symptome.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(symptome.date).toLocaleDateString("fr-FR")} Ã  {symptome.heure}
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
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Rendez-vous reÃ§us</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="ds-empty"><div className="ds-empty-icon"><Calendar className="h-5 w-5" /></div><p className="ds-empty-title">Aucun rendez-vous</p><p className="ds-empty-body">Vos prochains rendez-vous apparaîtront ici.</p></div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((rdv) => (
                    <div
                      key={rdv.id}
                      className="ds-row"><div className="flex justify-between items-center gap-3">
                        <div>
                          <p className="ds-row-name">{rdv.patient?.nom || "Patient"}</p>
                          <p className="text-sm">
                            {new Date(rdv.date_rdv).toLocaleDateString("fr-FR")} Ã  {rdv.heure}
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
                            GÃ©rer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog pour gÃ©rer un rendez-vous */}
          <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>GÃ©rer le rendez-vous</DialogTitle>
                <DialogDescription>
                  {selectedAppointment?.patient?.nom} - {new Date(selectedAppointment?.date_rdv || "").toLocaleDateString("fr-FR")} Ã  {selectedAppointment?.heure}
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
                  <Label>Notes du mÃ©decin</Label>
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
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>CrÃ©er une prescription</CardTitle>
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
                      <SelectValue placeholder="SÃ©lectionner un patient" />
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
                  <Label>MÃ©dicaments</Label>
                  <Input
                    value={nouvellePrescription.medicaments}
                    onChange={(e) => setNouvellePrescription({...nouvellePrescription, medicaments: e.target.value})}
                    placeholder="Ex: ParacÃ©tamol, IbuprofÃ¨ne, Vitamine C (sÃ©parÃ©s par des virgules)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    SÃ©parez les mÃ©dicaments par des virgules
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
                  <Label>DurÃ©e du traitement</Label>
                  <Input
                    value={nouvellePrescription.duree_traitement}
                    onChange={(e) => setNouvellePrescription({...nouvellePrescription, duree_traitement: e.target.value})}
                    placeholder="Ex: 7 jours"
                  />
                </div>
                <Button type="submit" className="rounded-xl h-11 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">Créer la prescription</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="premium-card mt-6">
            <CardHeader>
              <CardTitle className="ds-section-title">Prescriptions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p>Aucune prescription</p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((presc) => (
                    <div
                      key={presc.id}
                      className="premium-list-item"
                    >
                      <p className="ds-row-name">{presc.description}</p>
                      {presc.medicaments && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">MÃ©dicaments:</p>
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
                          <p className="text-sm font-medium text-gray-700">DurÃ©e:</p>
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
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>GÃ©rer mon planning de disponibilitÃ©</CardTitle>
              <CardDescription>
                DÃ©finissez vos horaires de disponibilitÃ© pour la semaine
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
                        <SelectValue placeholder="SÃ©lectionner un jour" />
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
                    <Label>Heure de dÃ©but</Label>
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
                <Button type="submit" className="rounded-xl h-11 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">Ajouter au planning</Button>
              </form>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Mon planning actuel</h3>
                {plannings.length === 0 ? (
                  <p className="ds-empty-body">Aucun planning dÃ©fini</p>
                ) : (
                  <div className="space-y-4">
                    {plannings.map((planning) => (
                      <div
                        key={planning.id}
                        className="ds-row"><div className="flex justify-between items-center gap-3">
                          <div>
                            <p className="ds-row-name">
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
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Alertes Ã©pidÃ©miologiques</CardTitle>
              <CardDescription>
                Surveillez et gÃ©rez les alertes Ã©pidÃ©miologiques dÃ©tectÃ©es
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bouton pour dÃ©clencher l'analyse Ã©pidÃ©miologique */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Analyse Ã©pidÃ©miologique</h3>
                    <p className="text-sm text-gray-600">
                      DÃ©clenchez une analyse pour dÃ©tecter les Ã©pidÃ©mies potentielles (seuil : 5 patients minimum)
                    </p>
                  </div>
                  <Button 
                    onClick={analyserSymptomes}
                    disabled={loadingAlertes}
                    className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold transition-colors focus:ring-2 focus:ring-red-400"
                  >
                    {loadingAlertes ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyse en cours...
                      </div>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Analyser les symptÃ´mes
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
                      <p className="text-sm">Cliquez sur "Analyser les symptÃ´mes" pour dÃ©tecter les Ã©pidÃ©mies</p>
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
                                    Ã‰pidÃ©mie dÃ©tectÃ©e
                                  </h4>
                                  <Badge variant="destructive">
                                    {alerte.nombrePatients} patients
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>SymptÃ´me:</strong> {alerte.symptome}
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
                                  DÃ©tectÃ© le {new Date(alerte.dateDetection).toLocaleDateString("fr-FR")} Ã  {new Date(alerte.dateDetection).toLocaleTimeString("fr-FR")}
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
                                  RÃ©soudre
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Historique des alertes rÃ©solues */}
                {alertes.filter(a => a.statut === "RESOLVED").length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Alertes rÃ©solues ({alertes.filter(a => a.statut === "RESOLVED").length})
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
                                    Alerte rÃ©solue
                                  </h4>
                                  <Badge variant="secondary">
                                    {alerte.nombrePatients} patients
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>SymptÃ´me:</strong> {alerte.symptome}
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
                                  DÃ©tectÃ© le {new Date(alerte.dateDetection).toLocaleDateString("fr-FR")} Ã  {new Date(alerte.dateDetection).toLocaleTimeString("fr-FR")}
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


