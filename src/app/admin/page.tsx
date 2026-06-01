"use client"

import React, { useEffect, useState } from "react"
import api from "@/lib/axios"
import { useAuth } from "../context/authcontext"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Activity, Edit, Trash2 } from "lucide-react"

interface Medecin {
  id: string
  nom: string
  email: string
  specialite: string
  telephone: string
  statut: "actif" | "inactif"
}

interface Patient {
  id: string
  nom: string
  email: string
  statut: "actif" | "inactif"
}

interface Statistiques {
  totalPatients: number
  totalMedecins: number
}

interface Encadreur {
  id: string
  nom: string
  email: string
}

export default function AdminPage() {
  const { user, logout, deletePatient } = useAuth()
  const router = useRouter()

  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [medecinEdit, setMedecinEdit] = useState<Medecin | null>(null)
  const [nouveauMedecin, setNouveauMedecin] = useState({
    nom: "",
    email: "",
    specialite: "",
    telephone: "",
    adresseCabinet: "",
    password: "",
  })

  const [encadreurs, setEncadreurs] = useState<Encadreur[]>([])
  const [nouveauEncadreur, setNouveauEncadreur] = useState({
    nom: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    if (user.role?.toLowerCase() !== "admin") {
      router.push("/")
      return
    }
    const fetchData = async () => {
      try {
        setLoading(true)
        const [medecinsRes, patientsRes, statsRes, encadreursRes] = await Promise.all([
          api.get("/admin/medecins"),
          api.get("/admin/patients"),
          api.get("/admin/statistiques"),
          api.get("/admin/encadreurs"),
        ])

        setMedecins(medecinsRes.data)
        setPatients(patientsRes.data)
        setStatistiques(statsRes.data)
        setEncadreurs(encadreursRes.data)
        setError(null)
      } catch (err) {
        console.error("Erreur chargement donnÃ©es admin :", err)
        setError("Erreur lors du chargement des donnÃ©es.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const ajouterMedecin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouveauMedecin.nom || !nouveauMedecin.email || !nouveauMedecin.password) {
      alert("Nom, email et mot de passe sont obligatoires")
      return
    }
    try {
      const res = await api.post("/admin/medecins", {
        nom: nouveauMedecin.nom,
        email: nouveauMedecin.email,
        password: nouveauMedecin.password,
        specialite: nouveauMedecin.specialite,
        telephone: nouveauMedecin.telephone,
        adresseCabinet: nouveauMedecin.adresseCabinet,
      })
      setMedecins([...medecins, res.data])
      setNouveauMedecin({ nom: "", email: "", specialite: "", telephone: "", adresseCabinet: "", password: "" })
      alert("MÃ©decin ajoutÃ©")
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message)
      } else {
        alert("Erreur lors de l'ajout")
      }
      console.error("Erreur ajout mÃ©decin :", err)
    }
  }

  const modifierMedecin = async (med: Medecin) => {
    if (!med.nom || !med.email) {
      alert("Nom et email sont obligatoires")
      return
    }
    try {
      const res = await api.put(`/admin/medecins/${med.id}`, med)
      setMedecins(medecins.map((m) => (m.id === med.id ? res.data : m)))
      setMedecinEdit(null)
      alert("MÃ©decin modifiÃ©")
    } catch (err) {
      console.error("Erreur modification mÃ©decin :", err)
      alert("Erreur lors de la modification")
    }
  }

  const supprimerMedecin = async (id: string) => {
    if (!confirm("Confirmer la suppression du mÃ©decin ?")) return
    try {
      await api.delete(`/admin/medecins/${id}`)
      setMedecins(medecins.filter((m) => m.id !== id))
      alert("MÃ©decin supprimÃ©")
    } catch (err) {
      console.error("Erreur suppression mÃ©decin :", err)
      alert("Erreur lors de la suppression")
    }
  }

  const changerStatutMedecin = async (med: Medecin) => {
    try {
      const nouveauStatut = med.statut === "actif" ? "inactif" : "actif"
      const res = await api.patch(`/admin/medecins/${med.id}/statut`, { statut: nouveauStatut })
      setMedecins(medecins.map((m) => (m.id === med.id ? res.data : m)))
      alert("Statut modifiÃ©")
    } catch (err) {
      console.error("Erreur changement statut :", err)
      alert("Erreur lors du changement de statut")
    }
  }

  const ajouterEncadreur = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouveauEncadreur.nom || !nouveauEncadreur.email || !nouveauEncadreur.password) {
      alert("Nom, email et mot de passe sont obligatoires")
      return
    }
    try {
      const res = await api.post("/admin/encadreurs", {
        nom: nouveauEncadreur.nom,
        email: nouveauEncadreur.email,
        password: nouveauEncadreur.password,
      })
      setEncadreurs([...encadreurs, res.data])
      setNouveauEncadreur({ nom: "", email: "", password: "" })
      alert("Encadreur ajoutÃ©")
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message)
      } else {
        alert("Erreur lors de l'ajout")
      }
      console.error("Erreur ajout encadreur :", err)
    }
  }

  const supprimerEncadreur = async (id: string) => {
    if (!confirm("Confirmer la suppression de l'encadreur ?")) return
    try {
      await api.delete(`/admin/encadreurs/${id}`)
      setEncadreurs(encadreurs.filter((e) => e.id !== id))
      alert("Encadreur supprimÃ©")
    } catch (err) {
      console.error("Erreur suppression encadreur :", err)
      alert("Erreur lors de la suppression")
    }
  }

  const supprimerPatient = async (id: string) => {
    if (!confirm("Confirmer la suppression du patient ? Cette action est irrÃ©versible.")) return
    try {
      await deletePatient(id)
      setPatients(patients.filter((p) => p.id !== id))
      alert("Patient supprimÃ© avec succÃ¨s")
    } catch (err) {
      console.error("Erreur suppression patient :", err)
      alert("Erreur lors de la suppression du patient")
    }
  }

  if (!user) return <div>Chargement...</div>
  if (user.role?.toLowerCase() !== "admin") return <div>AccÃ¨s interdit</div>
  if (loading) return <div>Chargement des donnÃ©es...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="premium-page">
      {/* 1. HEADER MODERNISÃ‰ */}
      <header className="premium-nav">
        <div className="premium-brand">
          <div className="premium-brand-icon">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="premium-wordmark">Health<span className="premium-wordmark-accent">SOD</span></span>
            <span className="premium-kicker">Espace Administrateur</span>
            <p className="mt-1 text-sm font-medium text-slate-600">Bienvenue, {user.nom}</p>
          </div>
        </div>
        <Button onClick={logout} className="premium-button">
          Déconnexion
        </Button>
      </header>

      {/* 2. TABS MODERNISÃ‰S */}
      <Tabs defaultValue="medecins" className="space-y-8 ">
        <TabsList className="premium-tabs grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="medecins" className="premium-tab flex items-center space-x-2">
            <span>MÃ©decins</span>
          </TabsTrigger>
          <TabsTrigger value="encadreurs" className="premium-tab flex items-center space-x-2">
            <span>Encadreurs</span>
          </TabsTrigger>
          <TabsTrigger value="patients" className="premium-tab flex items-center space-x-2">
            <span>Patients</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="premium-tab flex items-center space-x-2">
            <span>Statistiques</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medecins">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Ajouter un mÃ©decin</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={ajouterMedecin} className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={nouveauMedecin.nom}
                    onChange={(e) =>
                      setNouveauMedecin({ ...nouveauMedecin, nom: e.target.value })
                    }
                    required
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={nouveauMedecin.email}
                    onChange={(e) =>
                      setNouveauMedecin({ ...nouveauMedecin, email: e.target.value })
                    }
                    required
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>SpÃ©cialitÃ©</Label>
                  <Input
                    value={nouveauMedecin.specialite}
                    onChange={(e) =>
                      setNouveauMedecin({ ...nouveauMedecin, specialite: e.target.value })
                    }
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>TÃ©lÃ©phone</Label>
                  <Input
                    value={nouveauMedecin.telephone}
                    onChange={(e) =>
                      setNouveauMedecin({ ...nouveauMedecin, telephone: e.target.value })
                    }
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>Adresse du cabinet</Label>
                  <Input
                    value={nouveauMedecin.adresseCabinet}
                    onChange={(e) =>
                      setNouveauMedecin({ ...nouveauMedecin, adresseCabinet: e.target.value })
                    }
                    required
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <Input
                    type="password"
                    value={nouveauMedecin.password}
                    onChange={(e) =>
                      setNouveauMedecin({ ...nouveauMedecin, password: e.target.value })
                    }
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors">Ajouter</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="premium-card mt-6">
            <CardHeader>
              <CardTitle>Liste des mÃ©decins</CardTitle>
            </CardHeader>
            <CardContent>
              {medecins.length === 0 ? (
                <p>Aucun mÃ©decin trouvÃ©</p>
              ) : (
                <div className="space-y-4">
                  {medecins.map((med) =>
                    medecinEdit?.id === med.id ? (
                      <div
                        key={med.id}
                        className="space-y-2 p-4 border rounded-md bg-white"
                      >
                        <Input
                          value={medecinEdit.nom}
                          onChange={(e) =>
                            setMedecinEdit({ ...medecinEdit, nom: e.target.value })
                          }
                          className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        <Input
                          type="email"
                          value={medecinEdit.email}
                          onChange={(e) =>
                            setMedecinEdit({ ...medecinEdit, email: e.target.value })
                          }
                          className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        <Input
                          value={medecinEdit.specialite}
                          onChange={(e) =>
                            setMedecinEdit({ ...medecinEdit, specialite: e.target.value })
                          }
                          className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        <Input
                          value={medecinEdit.telephone}
                          onChange={(e) =>
                            setMedecinEdit({ ...medecinEdit, telephone: e.target.value })
                          }
                          className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => modifierMedecin(medecinEdit)} className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors">
                            Sauvegarder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMedecinEdit(null)}
                            className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={med.id}
                        className="flex justify-between items-center p-4 border rounded-md bg-white"
                      >
                        <div>
                          <p className="ds-row-name">{med.nom}</p>
                          <p className="text-sm">{med.specialite}</p>
                          <p className="text-sm">{med.telephone}</p>
                          <Badge variant={med.statut === "actif" ? "default" : "secondary"} className={med.statut === "actif" ? "ds-badge ds-badge-ok" : "ds-badge ds-badge-neutral"}>
                            {med.statut}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMedecinEdit(med)}
                            className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={med.statut === "actif" ? "destructive" : "default"}
                            onClick={() => changerStatutMedecin(med)}
                            className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors"
                          >
                            {med.statut === "actif" ? "DÃ©sactiver" : "Activer"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => supprimerMedecin(med.id)}
                            className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encadreurs">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Ajouter un encadreur</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={ajouterEncadreur} className="space-y-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={nouveauEncadreur.nom}
                    onChange={(e) =>
                      setNouveauEncadreur({ ...nouveauEncadreur, nom: e.target.value })
                    }
                    required
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={nouveauEncadreur.email}
                    onChange={(e) =>
                      setNouveauEncadreur({ ...nouveauEncadreur, email: e.target.value })
                    }
                    required
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <Input
                    type="password"
                    value={nouveauEncadreur.password}
                    onChange={(e) =>
                      setNouveauEncadreur({ ...nouveauEncadreur, password: e.target.value })
                    }
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors">Ajouter</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="premium-card mt-6">
            <CardHeader>
              <CardTitle>Liste des encadreurs</CardTitle>
            </CardHeader>
            <CardContent>
              {encadreurs.length === 0 ? (
                <p>Aucun encadreur trouvÃ©</p>
              ) : (
                <div className="space-y-4">
                  {encadreurs.map((encadreur) => (
                    <div
                      key={encadreur.id}
                      className="flex justify-between items-center p-4 border rounded-md bg-white"
                    >
                      <div>
                        <p className="ds-row-name">{encadreur.nom}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => supprimerEncadreur(encadreur.id)}
                          className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Liste des patients</CardTitle>
              <CardDescription>GÃ©rez les patients du systÃ¨me</CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun patient trouvÃ©</p>
              ) : (
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 border rounded-md bg-white flex justify-between items-center"
                    >
                      <div>
                        <p className="ds-row-name">{patient.nom}</p>
                        <Badge variant={patient.statut === "actif" ? "default" : "secondary"} className={patient.statut === "actif" ? "ds-badge ds-badge-ok" : "ds-badge ds-badge-neutral"}>
                          {patient.statut}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => supprimerPatient(patient.id)}
                          className="rounded-xl bg-gradient-to-r from-gray-600 to-blue-600 text-white font-semibold transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Statistiques gÃ©nÃ©rales</CardTitle>
              <CardDescription>Nombre total de patients et mÃ©decins</CardDescription>
            </CardHeader>
            <CardContent>
              {statistiques ? (
                <div className="space-y-2">
                  <p>Total patients : {statistiques.totalPatients}</p>
                  <p>Total mÃ©decins : {statistiques.totalMedecins}</p>
                </div>
              ) : (
                <p>Pas de statistiques disponibles</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



