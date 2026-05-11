"use client"

import { useState } from "react"
import { useAuth, type Patient, type Symptome } from "../context/authcontext"
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
import {
  Users,
  Search,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Clock,
  LogOut,
  Eye,
} from "lucide-react"
import api from "@/lib/axios"

export default function EncadreurPage() {
  const { encadreur, user, logout, rechercherPatient, getSymptomesPatientEncadreur } = useAuth()
  
  // États pour les données
  const [patientRecherche, setPatientRecherche] = useState<Patient | null>(null)
  const [symptomesPatient, setSymptomesPatient] = useState<Symptome[]>([])
  const [emailRecherche, setEmailRecherche] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false)
  const [suivis, setSuivis] = useState<any[]>([])
  const [loadingSuivis, setLoadingSuivis] = useState(false)
  const [errorSuivis, setErrorSuivis] = useState<string | null>(null)

  const handleRechercherPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRecherche.trim()) {
      alert("Veuillez saisir l'email du patient")
      return
    }
    setIsLoading(true)
    setErrorSuivis(null)
    try {
      // Recherche patient par email
      const patientRes = await api.get(`/encadreur/patient?email=${encodeURIComponent(emailRecherche)}`)
      const patient = patientRes.data
      setPatientRecherche(patient)
      setRechercheEffectuee(true)
      // Symptômes
      const symptomesRes = await api.get(`/encadreur/patient/${patient.id}/symptomes`)
      setSymptomesPatient(symptomesRes.data)
      // Suivis
      setLoadingSuivis(true)
      const suivisRes = await api.get(`/encadreur/patient/${patient.id}/suivis`)
      setSuivis(suivisRes.data)
      setLoadingSuivis(false)
    } catch (error: any) {
      setPatientRecherche(null)
        setSymptomesPatient([])
      setSuivis([])
      setRechercheEffectuee(true)
      setErrorSuivis(error?.response?.data?.message || "Erreur lors de la recherche du patient")
    } finally {
      setIsLoading(false)
      setLoadingSuivis(false)
    }
  }

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case "faible":
        return <Badge variant="default" className="bg-green-100 text-green-800 animate-pulse">Faible</Badge>
      case "moderee":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 animate-pulse">Modérée</Badge>
      case "elevee":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 animate-pulse">Élevée</Badge>
      default:
        return <Badge variant="secondary">{gravite}</Badge>
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif":
        return <Badge variant="default" className="bg-red-100 text-red-800 animate-pulse">Actif</Badge>
      case "resolu":
        return <Badge variant="default" className="bg-green-100 text-green-800 animate-pulse">Résolu</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
    }
  }

  if (!user || user.role?.toLowerCase() !== "encadreur") {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return <div>Accès interdit</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="backdrop-blur-md bg-white/60 border-b border-slate-200 shadow-lg animate-fade-in sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-md animate-pop-in">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient-text">Espace Encadreur</h1>
                <p className="text-sm text-slate-600">Bienvenue, {encadreur && encadreur.nom}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{encadreur && encadreur.email}</p>
                <p className="text-xs text-slate-500">Encadreur</p>
              </div>
              <Button variant="outline" onClick={logout} className="ml-2 transition-transform hover:scale-105 focus:ring-2 focus:ring-purple-400">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Recherche de patient */}
          <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Rechercher un patient</span>
              </CardTitle>
              <CardDescription>
                Entrez l'adresse email du patient pour consulter ses symptômes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRechercherPatient} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email du patient</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                      value={emailRecherche}
                      onChange={(e) => setEmailRecherche(e.target.value)}
                      required
                      className="rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <Button type="submit" disabled={isLoading} className="rounded-xl shadow-md bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold transition-transform hover:scale-105 focus:ring-2 focus:ring-purple-400">
                      {isLoading ? (
                        "Recherche..."
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Rechercher
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Résultats de recherche */}
          {rechercheEffectuee && (
            <>
              {patientRecherche ? (
                <div className="space-y-6">
                  {/* Informations du patient */}
                  <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Informations du patient</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Nom complet</Label>
                            <p className="text-gray-900">{patientRecherche.nom}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Email</Label>
                            <p className="text-gray-900">{patientRecherche.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                            <p className="text-gray-900">{patientRecherche.telephone || "Non renseigné"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Numéro de sécurité sociale</Label>
                            <p className="text-gray-900">{patientRecherche.numero}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Sexe</Label>
                            <p className="text-gray-900">{patientRecherche.sexe === "M" ? "Masculin" : "Féminin"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Date de naissance</Label>
                            <p className="text-gray-900">{patientRecherche.date_naissance}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Ville</Label>
                            <p className="text-gray-900">{patientRecherche.ville}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Quartier</Label>
                            <p className="text-gray-900">{patientRecherche.quartier}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptômes du patient */}
                  <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Symptômes du patient</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {symptomesPatient.length === 0 ? (
                        <p className="text-gray-500">Aucun symptôme trouvé.</p>
                      ) : (
                        <ul className="space-y-2">
                          {symptomesPatient.map((s) => (
                            <li key={s.id} className="border rounded p-2 flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <span className="font-medium">{s.description}</span>
                                  </div>
                              <div className="flex space-x-2 mt-2 md:mt-0">
                                {s.gravite ? getGraviteBadge(s.gravite as string) : null}
                                {s.statut ? getStatutBadge(s.statut as string) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  {/* Suivis du patient */}
                  <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
                    <CardHeader>
                      <CardTitle>Notes de suivi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingSuivis ? (
                        <div>Chargement des suivis...</div>
                      ) : (
                        <>
                          {suivis.length === 0 ? (
                            <p className="text-gray-500">Aucun suivi pour ce patient.</p>
                          ) : (
                            <ul className="space-y-2">
                              {suivis.map((suivi) => (
                                <li key={suivi.id} className="border rounded p-2">
                                  <div className="text-sm text-gray-700">{suivi.note}</div>
                                  <div className="text-xs text-gray-400">{suivi.dateCreation?.replace("T", " ").slice(0, 16)}</div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Analyse des tendances */}
                  <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Analyse des tendances</span>
                      </CardTitle>
                      <CardDescription>
                        Résumé des symptômes pour ce patient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900">Total symptômes</h4>
                          <p className="text-2xl font-bold text-blue-600">{symptomesPatient.length}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-900">Symptômes actifs</h4>
                          <p className="text-2xl font-bold text-yellow-600">
                            {symptomesPatient.filter(s => s.statut === "actif").length}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-900">Symptômes élevés</h4>
                          <p className="text-2xl font-bold text-red-600">
                            {symptomesPatient.filter(s => s.gravite === "elevee").length}
                          </p>
                        </div>
                      </div>
                      
                      {symptomesPatient.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-3">Répartition par gravité</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Faible</span>
                              <span className="text-sm font-medium">
                                {symptomesPatient.filter(s => s.gravite === "faible").length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Modérée</span>
                              <span className="text-sm font-medium">
                                {symptomesPatient.filter(s => s.gravite === "moderee").length}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Élevée</span>
                              <span className="text-sm font-medium">
                                {symptomesPatient.filter(s => s.gravite === "elevee").length}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-red-600 font-semibold">{errorSuivis || "Aucun patient trouvé avec cet email."}</div>
              )}
            </>
          )}

          {/* Instructions */}
          {!rechercheEffectuee && (
            <Card className="shadow-xl rounded-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 transition-transform hover:scale-[1.02] animate-fade-in">
              <CardContent className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Rechercher un patient
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Entrez l'adresse email d'un patient pour consulter ses informations 
                  et son historique de symptômes. Cette fonctionnalité vous permet 
                  de suivre l'évolution de la santé des patients.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 