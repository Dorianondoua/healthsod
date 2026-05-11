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
  Heart,
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

export default function PatientPage() {
  const { patient, user, logout, ajouterSymptome, getSymptomes, prendreRendezVous, getRendezVous, getPrescriptions, getMedecins } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // LOGS DE DEBUG INITIAUX
  console.log('[DEBUG][PatientPage] Render - user:', user, 'patient:', patient);

  // États pour les données
  const [symptomes, setSymptomes] = useState<Symptome[]>([])
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medecins, setMedecins] = useState<Medecin[]>([])

  // États pour les formulaires
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

  // États pour le planning
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

  // Charger les données au montage du composant
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
          console.error("Erreur lors du chargement des médecins:", error);
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
      
      // Charger le planning des médecins
      try {
        const planningRes = await api.get('/medecins/planning-disponibilite')
        console.log('[DEBUG][Patient] Réponse planning:', planningRes.data)
        if (Array.isArray(planningRes.data)) {
          setPlanningMedecins(planningRes.data)
        } else {
          setPlanningMedecins([])
          alert('Format inattendu pour le planning des médecins. Voir la console pour le détail.')
        }
      } catch (err) {
        console.error('Erreur chargement planning:', err)
        setPlanningMedecins([])
        alert("Erreur lors du chargement du planning des médecins. Veuillez réessayer plus tard.")
      }
      
      // setMedecins(await getMedecins()) // à activer si tu as l'API pour les médecins
      } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAjouterSymptome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!patient) {
      alert("Patient non connecté");
      setIsLoading(false);
      return;
    }
    try {
      console.log("Ajout symptome pour patient.id =", patient.id, "user.email =", user?.email);
      await ajouterSymptome({
        description: nouveauSymptome.description,
        gravite: nouveauSymptome.gravite.toUpperCase() as any,
        date: '', // sera ignoré côté backend
        heure: '', // sera ignoré côté backend
      });
      setNouveauSymptome({ description: "", gravite: "moderee" });
      await chargerDonnees(); // Rafraîchir la liste
      alert("Symptôme enregistré avec succès!");
      } catch (error) {
      alert("Erreur lors de l'enregistrement du symptôme");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrendreRendezVous = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!patient) {
      alert("Patient non connecté");
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
      alert("Rendez-vous pris avec succès!");
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
        return <Badge variant="default" className="bg-green-500">Confirmé</Badge>
      case "annule":
        return <Badge variant="destructive">Annulé</Badge>
      case "reporte":
        return <Badge variant="outline">Reporté</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
      }
    }

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case "faible":
        return <Badge variant="default" className="bg-green-500">Faible</Badge>
      case "moderee":
        return <Badge variant="default" className="bg-yellow-500">Modérée</Badge>
      case "elevee":
        return <Badge variant="destructive">Élevée</Badge>
      default:
        return <Badge variant="secondary">{gravite}</Badge>
    }
  }

  if (loading || user === null || patient === null) {
    return <div>Chargement...</div>;
  }

  if (!user || user.role?.toLowerCase() !== "patient" || !patient) {
    return <div>Accès interdit</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="backdrop-blur-md bg-white/60 border-b border-slate-200 shadow-lg animate-fade-in sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md animate-pop-in">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-text">Espace Patient</h1>
                <p className="text-sm text-slate-600">Bienvenue, {patient.nom}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{patient.email}</p>
                <p className="text-xs text-slate-500">{patient.ville}, {patient.quartier}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <User className="h-6 w-6 text-white" />
              </div>
              <Button variant="outline" onClick={logout} className="ml-2 transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-400">
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="symptomes" className="space-y-8 animate-fade-in">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-md rounded-xl shadow-md">
            <TabsTrigger value="symptomes" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-blue-400">
              <AlertTriangle className="h-4 w-4 transition-transform group-hover:rotate-6" />
              <span>Symptômes</span>
            </TabsTrigger>
            <TabsTrigger value="rendez-vous" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-blue-400">
              <Calendar className="h-4 w-4 transition-transform group-hover:-rotate-6" />
              <span>Rendez-vous</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-blue-400">
              <FileText className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Prescriptions</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="flex items-center space-x-2 transition-all hover:scale-105 focus:ring-2 focus:ring-blue-400">
              <User className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Symptômes */}
          <TabsContent value="symptomes" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulaire d'ajout de symptôme */}
              <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Enregistrer un symptôme</span>
                  </CardTitle>
                  <CardDescription>
                    Décrivez vos symptômes pour un meilleur suivi médical
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAjouterSymptome} className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description du symptôme</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez vos symptômes en détail..."
                        value={nouveauSymptome.description}
                        onChange={(e) => setNouveauSymptome({ ...nouveauSymptome, description: e.target.value })}
                        required
                        className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gravite">Niveau de gravité</Label>
                      <Select
                        value={nouveauSymptome.gravite}
                        onValueChange={(value: "faible" | "moderee" | "elevee") =>
                          setNouveauSymptome({ ...nouveauSymptome, gravite: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all">
                          <SelectValue placeholder="Sélectionner la gravité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faible">Faible</SelectItem>
                          <SelectItem value="moderee">Modérée</SelectItem>
                          <SelectItem value="elevee">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-400" disabled={isLoading}>
                      {isLoading ? "Enregistrement..." : "Enregistrer le symptôme"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Liste des symptômes */}
              <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Historique des symptômes</span>
                  </CardTitle>
                  <CardDescription>
                    Vos symptômes enregistrés ({symptomes.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
        {symptomes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun symptôme enregistré</p>
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
              {/* Liste des médecins disponibles */}
              {medecins.length > 0 && (
                <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Stethoscope className="h-5 w-5" />
                      <span>Médecins disponibles</span>
                    </CardTitle>
                    <CardDescription>
                      Choisissez un médecin pour votre rendez-vous
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medecins.map((medecin) => (
                        <div key={String(medecin.id)} className="border rounded-lg p-4 flex flex-col">
                          <span className="font-semibold text-lg">{medecin.nom}</span>
                          <span className="text-gray-600">Spécialité : {medecin.specialite}</span>
                          <span className="text-gray-500 text-sm">{medecin.email}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire de prise de rendez-vous */}
              <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Prendre un rendez-vous</span>
                  </CardTitle>
                  <CardDescription>
                    Planifiez votre consultation avec un médecin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePrendreRendezVous} className="space-y-4">
                    <div>
                      <Label htmlFor="medecin">Médecin</Label>
                      <Select
                        value={String(nouveauRendezVous.medecin_id)}
                        onValueChange={(value) => setNouveauRendezVous({ ...nouveauRendezVous, medecin_id: String(value) })}
                      >
                        <SelectTrigger className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all">
                          <SelectValue placeholder="Choisir un médecin" />
                        </SelectTrigger>
                        <SelectContent>
                          {medecins.map((medecin) => (
                            <SelectItem key={String(medecin.id)} value={String(medecin.id)}>
                              <div className="flex items-center space-x-2">
                                <Stethoscope className="h-4 w-4" />
                                <span>{medecin.nom} - {medecin.specialite}</span>
                              </div>
                            </SelectItem>
                          ))}
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
                          className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all"
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
                          className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="motif">Motif de consultation</Label>
                      <Textarea
                        id="motif"
                        placeholder="Décrivez le motif de votre consultation..."
                        value={nouveauRendezVous.motif}
                        onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, motif: e.target.value })}
                        className="rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all"
                      />
                    </div>

                    <Button type="submit" className="w-full rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-400" disabled={isLoading}>
                      {isLoading ? "Prise de rendez-vous..." : "Prendre rendez-vous"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Planning des médecins */}
              <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Disponibilités des médecins</span>
                  </CardTitle>
                  <CardDescription>
                    Consultez les horaires de disponibilité des médecins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {planningMedecins.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucune disponibilité affichée</p>
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
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-800">Note:</p>
                              <p className="text-sm text-blue-700">{planning.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liste des rendez-vous */}
              <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Mes rendez-vous</span>
                  </CardTitle>
                  <CardDescription>
                    Vos rendez-vous programmés ({rendezVous.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
        {rendezVous.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun rendez-vous programmé</p>
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
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-800">Note du médecin:</p>
                              <p className="text-sm text-blue-700">{rdv.notes_medecin}</p>
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
            <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Historique des prescriptions</span>
                </CardTitle>
                <CardDescription>
                  Vos prescriptions médicales ({prescriptions.length})
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
                            {prescription.statut === "active" ? "Active" : "Terminée"}
                          </Badge>
                        </div>
                        
                        {prescription.medicaments && prescription.medicaments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Médicaments:</p>
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
                            <p className="text-sm font-medium text-gray-700">Durée du traitement:</p>
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
            <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 transition-transform hover:scale-[1.02] animate-fade-in">
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
                      <p className="text-gray-900">{patient.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                      <p className="text-gray-900">{patient.telephone || "Non renseigné"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Numéro de sécurité sociale</Label>
                      <p className="text-gray-900">{patient.numero}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Sexe</Label>
                      <p className="text-gray-900">{patient.sexe === "M" ? "Masculin" : "Féminin"}</p>
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
