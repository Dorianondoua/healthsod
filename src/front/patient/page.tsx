"use client"
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/front/componentsPANTIENT/ui/card';
import { Button } from '@/front/componentsPANTIENT/ui/button';
import { Input } from '@/front/componentsPANTIENT/ui/input';
import { Label } from '@/front/componentsPANTIENT/ui/label';
import { Textarea } from '@/front/componentsPANTIENT/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/front/componentsPANTIENT/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/front/componentsPANTIENT/ui/tabs';
import { Badge } from '@/front/componentsPANTIENT/ui/badge';
import { Heart, Calendar, FileText, Plus, Clock, MapPin, User, AlertTriangle, CheckCircle, XCircle, CalendarDays, Stethoscope, Activity, Pill, UserCircle, LogOut, Bell, Search, Filter, ChevronRight, Star, Shield, Mail, Phone, MapPin as LocationIcon, Calendar as CalendarIcon, Clock as TimeIcon, FileText as PrescriptionIcon, Heart as HeartIcon, Activity as ActivityIcon, Zap, Sparkles, Flame, AlertCircle, CheckCircle2, XCircle as CancelIcon, RotateCcw, Eye, Download, Share2, Settings, HelpCircle, Bookmark, TrendingUp, BarChart3, PieChart, Calendar as Calendar3, Clock3, Users, Building2, GraduationCap } from 'lucide-react';
import { useAuth, Patient, Medecin, Symptome, RendezVous, Prescription } from '../../app/context/authcontext';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';

// Types simulés
interface Planning {
  id?: string;
  medecinId: string;
  medecinNom: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  disponible: boolean;
  notes?: string;
}

export default function PatientPage() {
  const { patient, user, logout, ajouterSymptome, getSymptomes, prendreRendezVous, getRendezVous, getPrescriptions, getMedecins } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // États pour les données
  const [symptomes, setSymptomes] = useState<Symptome[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);

  // États pour les formulaires
  const [nouveauSymptome, setNouveauSymptome] = useState({
    description: "",
    gravite: "moderee" as "faible" | "moderee" | "elevee",
  });
  
  const [nouveauRendezVous, setNouveauRendezVous] = useState({
    medecin_id: "",
    date: "",
    heure: "",
    motif: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // États pour le planning
  const [planningMedecins, setPlanningMedecins] = useState<Planning[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState<string>("");

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "patient" || !patient) {
      router.replace("/");
      return;
    }
    setLoading(false);
  }, [user, patient, router]);

  // Charger les données au montage du composant
  useEffect(() => {
    if (patient?.id) {
      chargerDonnees();
    }
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
  }, [user]);

  const chargerDonnees = async () => {
    if (!patient?.id) return;
    setIsLoading(true);
    try {
      const [symptomesData, rendezVousData, prescriptionsData] = await Promise.all([
        getSymptomes(patient.id),
        getRendezVous(patient.id),
        getPrescriptions(patient.id)
      ]);
      setSymptomes(symptomesData.map(s => ({
        ...s,
        gravite: s.gravite?.toLowerCase() as "faible" | "moderee" | "elevee"
      })));
      setRendezVous(rendezVousData.map(rdv => ({
        ...rdv,
        statut: rdv.statut.toLowerCase() as "en_attente" | "confirme" | "annule" | "reporte"
      })));
      setPrescriptions(prescriptionsData.map(p => ({
        ...p,
        statut: p.statut as "active" | "terminee"
      })));
      
      // Charger le planning des médecins
      try {
        const planningRes = await api.get('/medecins/planning-disponibilite');
        setPlanningMedecins(planningRes.data);
      } catch (err) {
        console.error("Erreur chargement planning:", err);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAjouterSymptome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!patient) {
      alert("Patient non connecté");
      setIsLoading(false);
      return;
    }
    try {
      console.log("Ajout symptome pour patient.id =", patient.id, "patient.email =", patient?.email);
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "confirme":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmé</Badge>;
      case "annule":
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><CancelIcon className="h-3 w-3 mr-1" />Annulé</Badge>;
      case "reporte":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><RotateCcw className="h-3 w-3 mr-1" />Reporté</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case "FAIBLE":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Faible</Badge>;
      case "MODEREE":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Modérée</Badge>;
      case "ELEVEE":
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><Flame className="h-3 w-3 mr-1" />Élevée</Badge>;
      default:
        return <Badge variant="secondary">{gravite}</Badge>;
    }
  };

  if (loading || user === null || patient === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role?.toLowerCase() !== "patient" || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès interdit</h1>
          <p className="text-red-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* En-tête moderne */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    MediCare Pro
                  </h1>
                  <p className="text-sm text-slate-600">Espace Patient</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{patient.nom}</p>
                  <p className="text-xs text-slate-500">{patient.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={logout} className="ml-2">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Barre d'informations patient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">Bienvenue, {patient.nom}</span>
              </div>
              <div className="flex items-center space-x-2">
                <LocationIcon className="h-4 w-4" />
                <span className="text-sm">{patient.ville}, {patient.quartier}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <ActivityIcon className="h-4 w-4" />
                <span>Dernière visite: 15 Jan 2024</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Statut: Actif</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="symptomes" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="symptomes" className="flex items-center space-x-2">
              <ActivityIcon className="h-4 w-4" />
              <span>Symptômes</span>
            </TabsTrigger>
            <TabsTrigger value="rendez-vous" className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Rendez-vous</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center space-x-2">
              <PrescriptionIcon className="h-4 w-4" />
              <span>Prescriptions</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Symptômes */}
          <TabsContent value="symptomes" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulaire d'ajout de symptôme */}
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    <span>Enregistrer un symptôme</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Décrivez vos symptômes pour un meilleur suivi médical
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAjouterSymptome} className="space-y-4">
                    <div>
                      <Label htmlFor="description" className="text-slate-700">Description du symptôme</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez vos symptômes en détail..."
                        value={nouveauSymptome.description}
                        onChange={(e) => setNouveauSymptome({ ...nouveauSymptome, description: e.target.value })}
                        required
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gravite" className="text-slate-700">Niveau de gravité</Label>
                      <Select
                        value={nouveauSymptome.gravite}
                        onValueChange={(value: string) =>
                          setNouveauSymptome({ ...nouveauSymptome, gravite: value as "faible" | "moderee" | "elevee" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la gravité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faible">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Faible</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="moderee">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              <span>Modérée</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="elevee">
                            <div className="flex items-center space-x-2">
                              <Flame className="h-4 w-4 text-red-500" />
                              <span>Élevée</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Enregistrer le symptôme
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Liste des symptômes */}
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <ActivityIcon className="h-4 w-4 text-white" />
                    </div>
                    <span>Historique des symptômes</span>
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Vos symptômes enregistrés ({symptomes.length})
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {symptomes.length === 0 ? (
                    <div className="text-center py-12">
                      <ActivityIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 mb-2">Aucun symptôme enregistré</p>
                      <p className="text-sm text-slate-400">Commencez par enregistrer vos premiers symptômes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {symptomes.map((symptome) => (
                        <div key={symptome.id} className="group border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-3">
                            <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {symptome.description}
                            </p>
                            {getGraviteBadge(symptome.gravite || "MODEREE")}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span className="flex items-center space-x-1">
                              <CalendarDays className="h-4 w-4" />
                              <span>{symptome.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{symptome.heure}</span>
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
                <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
                    <CardTitle className="flex items-center space-x-2 text-purple-800">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span>Médecins disponibles</span>
                    </CardTitle>
                    <CardDescription className="text-purple-700">
                      Choisissez un médecin pour votre rendez-vous
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {medecins.map((medecin) => (
                        <div key={String(medecin.id)} className="group border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                              <Stethoscope className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                                {medecin.nom}
                              </h3>
                              <p className="text-sm text-slate-600 mb-1">{medecin.specialite}</p>
                              <p className="text-xs text-slate-500">{medecin.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Affichage du planning de disponibilité des médecins */}
              {planningMedecins && planningMedecins.length > 0 && (
                <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Calendar3 className="h-4 w-4 text-white" />
                      </div>
                      <span>Créneaux de disponibilité des médecins</span>
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Tous les créneaux disponibles par médecin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {medecins.map((medecin) => {
                        const plannings = planningMedecins.filter((p) => p.medecinId === String(medecin.id));
                        if (plannings.length === 0) return null;
                        return (
                          <div key={medecin.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                            <div className="flex items-center space-x-3 mb-2">
                              <Stethoscope className="h-5 w-5 text-purple-600" />
                              <span className="font-semibold text-slate-900">{medecin.nom}</span>
                              <span className="text-xs text-slate-500">({medecin.specialite})</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {plannings.map((planning, idx) => (
                                <div key={planning.id || idx} className={`rounded-lg border p-3 flex flex-col space-y-1 ${planning.disponible ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
                                  <div className="flex items-center space-x-2">
                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium text-slate-800">{planning.jour}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    <span className="text-slate-700">{planning.heureDebut} - {planning.heureFin}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {planning.disponible ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Disponible</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-slate-200 text-slate-600"><XCircle className="h-3 w-3 mr-1" />Indisponible</Badge>
                                    )}
                                  </div>
                                  {planning.notes && (
                                    <div className="text-xs text-slate-500 mt-1">{planning.notes}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire de prise de rendez-vous */}
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-white" />
                    </div>
                    <span>Prendre un rendez-vous</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Planifiez votre consultation avec un médecin
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handlePrendreRendezVous} className="space-y-4">
                    <div>
                      <Label htmlFor="medecin" className="text-slate-700">Médecin</Label>
                      <Select
                        value={String(nouveauRendezVous.medecin_id)}
                        onValueChange={(value) => setNouveauRendezVous({ ...nouveauRendezVous, medecin_id: String(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un médecin" />
                        </SelectTrigger>
                        <SelectContent>
                          {medecins.map((medecin) => (
                            <SelectItem key={String(medecin.id)} value={String(medecin.id)}>
                              <div className="flex items-center space-x-2">
                                <Stethoscope className="h-4 w-4 text-purple-500" />
                                <span>{medecin.nom} - {medecin.specialite}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date" className="text-slate-700">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={nouveauRendezVous.date}
                          onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, date: e.target.value })}
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heure" className="text-slate-700">Heure</Label>
                        <Input
                          id="heure"
                          type="time"
                          value={nouveauRendezVous.heure}
                          onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, heure: e.target.value })}
                          required
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="motif" className="text-slate-700">Motif de consultation</Label>
                      <Textarea
                        id="motif"
                        placeholder="Décrivez le motif de votre consultation..."
                        value={nouveauRendezVous.motif}
                        onChange={(e) => setNouveauRendezVous({ ...nouveauRendezVous, motif: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Prise de rendez-vous...
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Prendre rendez-vous
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Liste des rendez-vous */}
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Calendar3 className="h-4 w-4 text-white" />
                    </div>
                    <span>Mes rendez-vous</span>
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Vos rendez-vous programmés ({rendezVous.length})
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {rendezVous.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 mb-2">Aucun rendez-vous programmé</p>
                      <p className="text-sm text-slate-400">Prenez votre premier rendez-vous</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rendezVous.map((rdv) => (
                        <div key={rdv.id} className="group border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                {rdv.nom_medecin}
                              </p>
                              <p className="text-sm text-slate-600">{rdv.motif}</p>
                            </div>
                            {getStatutBadge(rdv.statut)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                            <span className="flex items-center space-x-1">
                              <CalendarDays className="h-4 w-4" />
                              <span>{rdv.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{rdv.heure}</span>
                            </span>
                          </div>
                          {rdv.notes_medecin && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-800 mb-1">Note du médecin:</p>
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
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Pill className="h-4 w-4 text-white" />
                  </div>
                  <span>Historique des prescriptions</span>
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Vos prescriptions médicales ({prescriptions.length})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Pill className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Aucune prescription disponible</p>
                    <p className="text-sm text-slate-400">Vos prescriptions apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} className="group border border-slate-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                              Dr. {prescription.medecin_nom}
                            </p>
                            <p className="text-sm text-slate-600">{prescription.description}</p>
                          </div>
                          <Badge variant={prescription.statut === "active" ? "default" : "secondary"} className={prescription.statut === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                            {prescription.statut === "active" ? (
                              <>
                                <Zap className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Terminée
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        {prescription.medicaments && prescription.medicaments.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                              <Pill className="h-4 w-4 mr-1" />
                              Médicaments:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {prescription.medicaments.map((med, index) => (
                                <div key={index} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                  <span className="text-sm text-slate-700">{med}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {prescription.posologie && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1 flex items-center">
                                <Clock3 className="h-4 w-4 mr-1" />
                                Posologie:
                              </p>
                              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">{prescription.posologie}</p>
                            </div>
                          )}
                          
                          {prescription.duree_traitement && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1 flex items-center">
                                <CalendarDays className="h-4 w-4 mr-1" />
                                Durée du traitement:
                              </p>
                              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">{prescription.duree_traitement}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span className="flex items-center space-x-1">
                              <CalendarDays className="h-4 w-4" />
                              <span>{prescription.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{prescription.heure}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
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
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
                <CardTitle className="flex items-center space-x-2 text-indigo-800">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <UserCircle className="h-4 w-4 text-white" />
                  </div>
                  <span>Informations personnelles</span>
                </CardTitle>
                <CardDescription className="text-indigo-700">
                  Vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Nom complet</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.nom}</p>
                    </div>
                    
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.email}</p>
                    </div>
                    
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>Téléphone</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.telephone || "Non renseigné"}</p>
                    </div>
                    
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Numéro de sécurité sociale</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.numero}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Sexe</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.sexe === "M" ? "Masculin" : "Féminin"}</p>
                    </div>
                    
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date de naissance</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.date_naissance}</p>
                    </div>
                    
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Ville</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.ville}</p>
                    </div>
                    
                    <div className="group p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>Quartier</span>
                      </Label>
                      <p className="text-slate-900 font-medium mt-1">{patient.quartier}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Modifier le profil</span>
                    </Button>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <HelpCircle className="h-4 w-4" />
                      <span>Aide</span>
                    </Button>
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