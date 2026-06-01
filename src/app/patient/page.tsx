"use client"

import { useState, useEffect } from "react"
import { useAuth, type Symptome, type RendezVous, type Prescription, type Medecin } from "../context/authcontext"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Calendar,
  FileText,
  Plus,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CalendarDays,
  Stethoscope,
} from "lucide-react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"

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

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export default function PatientPage() {
  const { patient, user, logout, ajouterSymptome, getSymptomes, prendreRendezVous, getRendezVous, getPrescriptions, getMedecins } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // LOGS DE DEBUG INITIAUX
  console.log('[DEBUG][PatientPage] Render - user:', user, 'patient:', patient);

  // Ã‰tats pour les donnÃ©es
  const [symptomes, setSymptomes] = useState<Symptome[]>([])
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medecins, setMedecins] = useState<Medecin[]>([])

  // Ã‰tats pour les formulaires
  const [nouveauSymptome, setNouveauSymptome] = useState({
    description: "",
    gravite: "moderee" as "faible" | "moderee" | "elevee",
  })
  
  const [nouveauRendezVous, setNouveauRendezVous] = useState({
    medecin_id: "",
    date: "",
    heure: "",
    motif: ""
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // Ã‰tats pour le planning
  const [planningMedecins, setPlanningMedecins] = useState<Planning[]>([])
  const [selectedMedecin, setSelectedMedecin] = useState<string>("")

  useEffect(() => {
    console.log('[DEBUG][PatientPage] useEffect patient:', patient, 'user:', user);
    if (!user || user.role?.toLowerCase() !== "patient" || !patient) {
      router.replace("/");
      return;
    }
    setLoading(false);
  }, [user, patient, router]);

  // Charger les donnÃ©es au montage du composant
  useEffect(() => {
    console.log('[DEBUG][PatientPage] useEffect chargerDonnees patient:', patient);
    if (patient?.id) {
      chargerDonnees();
    }
    // eslint-disable-next-line
  }, [patient]);

  useEffect(() => {
    if (user && user.role?.toLowerCase() === "patient") {
      (async () => {
        try {
          const medecinsData = await getMedecins();
          setMedecins(medecinsData);
        } catch (error) {
          console.error("Erreur lors du chargement des mÃ©decins:", error);
        }
      })();
    }
    // eslint-disable-next-line
  }, [user]);

  const chargerDonnees = async () => {
    if (!patient?.id) return
    setIsLoading(true)
      try {
      const [symptomesData, rendezVousData, prescriptionsData] = await Promise.all([
        getSymptomes(patient.id),
        getRendezVous(patient.id),
        getPrescriptions(patient.id)
      ])
      setSymptomes(symptomesData)
      setRendezVous(rendezVousData)
      setPrescriptions(prescriptionsData)
      
      // Charger le planning des mÃ©decins
      try {
        const planningRes = await api.get('/medecins/planning-disponibilite')
        console.log('[DEBUG][Patient] RÃ©ponse planning:', planningRes.data)
        if (Array.isArray(planningRes.data)) {
          setPlanningMedecins(planningRes.data)
        } else {
          setPlanningMedecins([])
          alert('Format inattendu pour le planning des mÃ©decins. Voir la console pour le dÃ©tail.')
        }
      } catch (err) {
        console.error('Erreur chargement planning:', err)
        setPlanningMedecins([])
        alert("Erreur lors du chargement du planning des mÃ©decins. Veuillez rÃ©essayer plus tard.")
      }
      
      // setMedecins(await getMedecins()) // Ã  activer si tu as l'API pour les mÃ©decins
      } catch (error) {
      console.error("Erreur lors du chargement des donnÃ©es:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAjouterSymptome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!patient) {
      alert("Patient non connectÃ©");
      setIsLoading(false);
      return;
    }
    try {
      console.log("Ajout symptome pour patient.id =", patient.id, "user.email =", user?.email);
      await ajouterSymptome({
        description: nouveauSymptome.description,
        gravite: nouveauSymptome.gravite.toUpperCase() as any,
        date: '', // sera ignorÃ© cÃ´tÃ© backend
        heure: '', // sera ignorÃ© cÃ´tÃ© backend
      });
      setNouveauSymptome({ description: "", gravite: "moderee" });
      await chargerDonnees(); // RafraÃ®chir la liste
      alert("SymptÃ´me enregistrÃ© avec succÃ¨s!");
      } catch (error) {
      alert("Erreur lors de l'enregistrement du symptÃ´me");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrendreRendezVous = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!patient) {
      alert("Patient non connectÃ©");
      setIsLoading(false);
      return;
    }
    try {
      await prendreRendezVous({
        medecin_id: String(nouveauRendezVous.medecin_id || ""),
        date: nouveauRendezVous.date,
        heure: nouveauRendezVous.heure,
        motif: nouveauRendezVous.motif
      });
      setNouveauRendezVous({ medecin_id: "", date: "", heure: "", motif: "" });
      await chargerDonnees();
      alert("Rendez-vous pris avec succÃ¨s!");
      } catch (error) {
      alert("Erreur lors de la prise de rendez-vous");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <Badge variant="secondary">En attente</Badge>
      case "confirme":
        return <Badge variant="default" className="bg-green-500">ConfirmÃ©</Badge>
      case "annule":
        return <Badge variant="destructive">AnnulÃ©</Badge>
      case "reporte":
        return <Badge variant="outline">ReportÃ©</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
      }
    }

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case "faible":
        return <Badge variant="default" className="bg-green-500">Faible</Badge>
      case "moderee":
        return <Badge variant="default" className="bg-yellow-500">ModÃ©rÃ©e</Badge>
      case "elevee":
        return <Badge variant="destructive">Ã‰levÃ©e</Badge>
      default:
        return <Badge variant="secondary">{gravite}</Badge>
    }
  }

  if (loading || user === null || patient === null) {
    return <div>Chargement...</div>;
  }

  if (!user || user.role?.toLowerCase() !== "patient" || !patient) {
    return <div>AccÃ¨s interdit</div>;
  }

  return (
    <div className="premium-page">
      {/* En-tÃªte */}
      <header className="premium-nav">
        <div className="premium-brand">
          <div className="premium-brand-icon">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="premium-wordmark">Health<span className="premium-wordmark-accent">SOD</span></span>
            <span className="premium-kicker">Espace Patient</span>
            <p className="mt-1 text-sm font-medium text-slate-600">Bienvenue, {patient.nom}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-slate-900">{maskEmail(patient.email)}</p>
            <p className="text-xs text-slate-500">{patient.ville}, {patient.quartier}</p>
          </div>
          <Button onClick={logout} className="premium-button">
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="symptomes" className="space-y-8 ">
          <TabsList className="premium-tabs grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="symptomes" className="premium-tab flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 transition-transform group-hover:rotate-6" />
              <span>SymptÃ´mes</span>
            </TabsTrigger>
            <TabsTrigger value="rendez-vous" className="premium-tab flex items-center space-x-2">
              <Calendar className="h-4 w-4 transition-transform group-hover:-rotate-6" />
              <span>Rendez-vous</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="premium-tab flex items-center space-x-2">
              <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Prescriptions</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="premium-tab flex items-center space-x-2">
              <User className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet SymptÃ´mes */}
          <TabsContent value="symptomes" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulaire d'ajout de symptÃ´me */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Enregistrer un symptÃ´me</span>
                  </CardTitle>
                  <CardDescription>
                    DÃ©crivez vos symptÃ´mes pour un meilleur suivi mÃ©dical
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAjouterSymptome} className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description du symptÃ´me</Label>
                      <Textarea
                        id="description"
                        placeholder="DÃ©crivez vos symptÃ´mes en dÃ©tail..."
                        value={nouveauSymptome.description}
                        onChange={(e) => setNouveauSymptome({ ...nouveauSymptome, description: e.target.value })}
                        required
                        className="rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gravite">Niveau de gravitÃ©</Label>
                      <Select
                        value={nouveauSymptome.gravite}
                        onValueChange={(value: "faible" | "moderee" | "elevee") =>
                          setNouveauSymptome({ ...nouveauSymptome, gravite: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-colors">
                          <SelectValue placeholder="SÃ©lectionner la gravitÃ©" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faible">Faible</SelectItem>
                          <SelectItem value="moderee">ModÃ©rÃ©e</SelectItem>
                          <SelectItem value="elevee">Ã‰levÃ©e</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors" disabled={isLoading}>
                      {isLoading ? "Enregistrement..." : "Enregistrer le symptÃ´me"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Liste des symptÃ´mes */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Historique des symptÃ´mes</span>
                  </CardTitle>
                  <CardDescription>
                    Vos symptÃ´mes enregistrÃ©s ({symptomes.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
        {symptomes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun symptÃ´me enregistrÃ©</p>
        ) : (
                    <div className="space-y-4">
            {symptomes.map((symptome) => (
                        <div key={symptome.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{symptome.description}</p>
                            {getGraviteBadge(symptome.gravite || "moderee")}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1" />
                              {symptome.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {symptome.heure}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Rendez-vous */}
          <TabsContent value="rendez-vous" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Liste des mÃ©decins disponibles */}
              {medecins.length > 0 && (
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Stethoscope className="h-5 w-5" />
                      <span>MÃ©decins disponibles</span>
                    </CardTitle>
                    <CardDescription>
                      Choisissez un mÃ©decin pour votre rendez-vous
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medecins.map((medecin) => {
                        const isOnline = medecin.statut === "actif"
                        return (
                          <div key={String(medecin.id)} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-1 bg-white hover:border-cyan-200 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">{medecin.nom}</span>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${isOnline ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                {isOnline ? "En ligne" : "Hors ligne"}
                              </span>
                            </div>
                            <span className="text-gray-600 text-sm">SpÃ©cialitÃ© : {medecin.specialite}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire de prise de rendez-vous */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Prendre un rendez-vous</span>
                  </CardTitle>
                  <CardDescription>
                    Planifiez votre consultation avec un mÃ©decin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePrendreRendezVous} className="space-y-4">
                    <div>
                      <Label htmlFor="medecin">MÃ©decin</Label>
                      <Select
                        value={String(nouveauRendezVous.medecin_id)}
                        onValueChange={(value) => setNouveauRendezVous({ ...nouveauRendezVous, medecin_id: String(value) })}
                      >
                        <SelectTrigger className="rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-colors">
                          <SelectValue placeholder="Choisir un mÃ©decin" />
                        </SelectTrigger>
                        <SelectContent>
                          {medecins.map((medecin) => {
                            const isOnline = medecin.statut === "actif"
                            return (
                              <SelectItem key={String(medecin.id)} value={String(medecin.id)}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                                  <span>{medecin.nom} - {medecin.specialite}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={nouveauRendezVous.date}
                          onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, date: e.target.value })}
                          required
                          className="rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-colors"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heure">Heure</Label>
                        <Input
                          id="heure"
                          type="time"
                          value={nouveauRendezVous.heure}
                          onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, heure: e.target.value })}
                          required
                          className="rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="motif">Motif de consultation</Label>
                      <Textarea
                        id="motif"
                        placeholder="DÃ©crivez le motif de votre consultation..."
                        value={nouveauRendezVous.motif}
                        onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, motif: e.target.value })}
                        className="rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-0 transition-colors"
                      />
                    </div>

                    <Button type="submit" className="w-full rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors" disabled={isLoading}>
                      {isLoading ? "Prise de rendez-vous..." : "Prendre rendez-vous"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Planning des mÃ©decins */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>DisponibilitÃ©s des mÃ©decins</span>
                  </CardTitle>
                  <CardDescription>
                    Consultez les horaires de disponibilitÃ© des mÃ©decins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {planningMedecins.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucune disponibilitÃ© affichÃ©e</p>
                  ) : (
                    <div className="space-y-4">
                      {planningMedecins.map((planning) => (
                        <div key={planning.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Dr. {planning.medecinNom}</p>
                              <p className="text-sm text-gray-600">
                                {planning.jour === "MONDAY" && "Lundi"}
                                {planning.jour === "TUESDAY" && "Mardi"}
                                {planning.jour === "WEDNESDAY" && "Mercredi"}
                                {planning.jour === "THURSDAY" && "Jeudi"}
                                {planning.jour === "FRIDAY" && "Vendredi"}
                                {planning.jour === "SATURDAY" && "Samedi"}
                                {planning.jour === "SUNDAY" && "Dimanche"}
                              </p>
                            </div>
                            <Badge variant={planning.disponible ? "default" : "secondary"}>
                              {planning.disponible ? "Disponible" : "Indisponible"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {planning.heureDebut} - {planning.heureFin}
                            </span>
                          </div>
                          {planning.notes && (
                            <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-lg">
                              <p className="text-sm font-medium text-cyan-700">Note:</p>
                              <p className="text-sm text-cyan-600">{planning.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liste des rendez-vous */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Mes rendez-vous</span>
                  </CardTitle>
                  <CardDescription>
                    Vos rendez-vous programmÃ©s ({rendezVous.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
        {rendezVous.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun rendez-vous programmÃ©</p>
        ) : (
                    <div className="space-y-4">
            {rendezVous.map((rdv) => (
                        <div key={rdv.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                <div>
                              <p className="font-medium">{rdv.nom_medecin}</p>
                              <p className="text-sm text-gray-600">{rdv.motif}</p>
                            </div>
                            {getStatutBadge(rdv.statut)}
                </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1" />
                              {rdv.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {rdv.heure}
                </span>
                          </div>
                          {rdv.notes_medecin && (
                            <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-lg">
                              <p className="text-sm font-medium text-cyan-700">Note du mÃ©decin:</p>
                              <p className="text-sm text-cyan-600">{rdv.notes_medecin}</p>
                            </div>
                          )}
                        </div>
            ))}
                    </div>
        )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Prescriptions */}
          <TabsContent value="prescriptions" className="space-y-6">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Historique des prescriptions</span>
                </CardTitle>
                <CardDescription>
                  Vos prescriptions mÃ©dicales ({prescriptions.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
        {prescriptions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune prescription disponible</p>
        ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Dr. {prescription.medecin_nom}</p>
                            <p className="text-sm text-gray-600">{prescription.description}</p>
                          </div>
                          <Badge variant={prescription.statut === "active" ? "default" : "secondary"}>
                            {prescription.statut === "active" ? "Active" : "TerminÃ©e"}
                          </Badge>
                        </div>
                        
                        {prescription.medicaments && prescription.medicaments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">MÃ©dicaments:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {prescription.medicaments.map((med, index) => (
                                <li key={index}>{med}</li>
            ))}
          </ul>
                          </div>
                        )}
                        
                        {prescription.posologie && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Posologie:</p>
                            <p className="text-sm text-gray-600">{prescription.posologie}</p>
                          </div>
                        )}
                        
                        {prescription.duree_traitement && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">DurÃ©e du traitement:</p>
                            <p className="text-sm text-gray-600">{prescription.duree_traitement}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <CalendarDays className="h-4 w-4 mr-1" />
                            {prescription.date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {prescription.heure}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Profil */}
          <TabsContent value="profil" className="space-y-6">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Informations personnelles</span>
                </CardTitle>
                <CardDescription>
                  Vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Nom complet</Label>
                      <p className="text-gray-900">{patient.nom}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-gray-900">{maskEmail(patient.email)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">TÃ©lÃ©phone</Label>
                      <p className="text-gray-900">{patient.telephone || "Non renseignÃ©"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">NumÃ©ro de sÃ©curitÃ© sociale</Label>
                      <p className="text-gray-900">{patient.numero}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Sexe</Label>
                      <p className="text-gray-900">{patient.sexe === "M" ? "Masculin" : "FÃ©minin"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Date de naissance</Label>
                      <p className="text-gray-900">{patient.date_naissance}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ville</Label>
                      <p className="text-gray-900">{patient.ville}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Quartier</Label>
                      <p className="text-gray-900">{patient.quartier}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


