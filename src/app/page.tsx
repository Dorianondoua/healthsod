"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LogIn,
  UserPlus,
  Shield,
  Heart,
  Stethoscope,
  Calendar,
  LineChart,
} from "lucide-react"

import { useAuth } from "./context/authcontext" // ✅ ton AuthContext

export default function AuthPage() {
  const router = useRouter()
  const { login, register, user, patient } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false)

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "patient" as "patient" | "medecin" | "admin" | "encadreur",
  })

  const [registerData, setRegisterData] = useState({
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    numero: "",
    sexe: "M" as "M" | "F",
    ville: "",
    quartier: "",
    date_naissance: "",
    telephone: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError(null)
    setLoginSuccess(false)

    const result = await login(loginData.email, loginData.password, loginData.role)
    if (!result.success) {
      setLoginError(result.message || "Erreur de connexion")
    } else {
      setLoginSuccess(true)
    }
    setIsLoading(false)
  }

  // Redirection automatique après connexion réussie et user prêt
  useEffect(() => {
    console.log("user:", user, "patient:", patient);
    if (user) {
      const role = user.role?.toLowerCase();
      if (role === "patient" && patient) router.push("/patient");
      else if (role === "medecin") router.push("/medecin");
      else if (role === "admin") router.push("/admin");
      else if (role === "encadreur") router.push("/encadreur");
    }
  }, [user, patient, router]);

  console.log("RENDER user:", user, "patient:", patient);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation du numéro de sécurité sociale
    if (registerData.numero.length < 5) {
      alert("Le numéro de sécurité sociale doit contenir au moins 5 caractères")
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)

    try {
      await register(registerData)
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.")
    } catch (error: any) {
      console.error("Erreur inscription", error)
      alert(error.message || "Erreur lors de l'inscription. Vérifiez que tous les champs sont correctement remplis.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-indigo-950 text-white overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <img
          src="/ZE.jpg"
          alt="Fond"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-indigo-950/70"></div>
      </div>

      {/* En-tête */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-center">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold">HealthCare Manager</h1>
          </div>
          <p className="text-xl max-w-2xl mx-auto">
            Système complet de gestion de la santé avec Analyse épidémiologique
          </p>
        </div>
      </header>

      {/* Cartes de fonctionnalités */}
      <main className="relative z-10 px-6 pt-20 pb-20 md:pt-32 md:pb-40 max-w-7xl mx-auto">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Votre <span className="text-blue-500">Santé</span>, Notre <span className="text-blue-500">Priorité</span>
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Stethoscope className="h-12 w-12 text-blue-500 mx-auto mb-4" />}
            title="Suivi Médical"
            desc="Symptômes, traitements, consultations."
          />
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />}
            title="Rendez-vous"
            desc="Planifiez facilement vos consultations."
          />
          <FeatureCard
            icon={<LineChart className="h-12 w-12 text-purple-500 mx-auto mb-4" />}
            title="Analyse"
            desc="Alertes épidémiologiques intelligentes."
          />
        </div>

        {/* Formulaire d'authentification */}
        <div className="relative z-10 flex items-center justify-center pt-12">
          <div className="w-full max-w-xl bg-white text-black rounded-2xl shadow-2xl p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">
                Authentification
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Connectez-vous ou créez un compte
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid grid-cols-2 bg-gray-100 p-1 mb-6 rounded-lg">
                  <TabsTrigger value="login">
                    <LogIn className="h-4 w-4 mr-1" /> Connexion
                  </TabsTrigger>
                  <TabsTrigger value="register">
                    <UserPlus className="h-4 w-4 mr-1" /> Inscription
                  </TabsTrigger>
                </TabsList>

                {/* Connexion */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Label>Rôle</Label>
                    <Select
                      value={loginData.role}
                      onValueChange={(value: "patient" | "medecin" | "admin" | "encadreur") =>
                        setLoginData({ ...loginData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="medecin">Médecin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="encadreur">Encadreur</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Email"
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Mot de passe"
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                    />
                    {loginError && (
                      <div className="text-red-500 text-sm">{loginError}</div>
                    )}
                    {loginSuccess && (
                      <div className="text-green-600 text-sm">Connexion réussie !</div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Connexion..." : "Se connecter"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Inscription */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input
                      placeholder="Nom complet"
                      value={registerData.nom}
                      onChange={(e) => setRegisterData({ ...registerData, nom: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Téléphone"
                      value={registerData.telephone}
                      onChange={(e) => setRegisterData({ ...registerData, telephone: e.target.value })}
                      required
                    />
                    <div>
                      <Input
                        placeholder="Numéro sécurité sociale (min 5 caractères)"
                        value={registerData.numero}
                        onChange={(e) => setRegisterData({ ...registerData, numero: e.target.value })}
                        required
                        minLength={5}
                      />
                      {registerData.numero.length > 0 && registerData.numero.length < 5 && (
                        <p className="text-red-500 text-xs mt-1">
                          Le numéro doit contenir au moins 5 caractères
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <Label>Sexe</Label>
                        <Select
                          value={registerData.sexe}
                          onValueChange={(value: "M" | "F") =>
                            setRegisterData({ ...registerData, sexe: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sexe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Homme</SelectItem>
                            <SelectItem value="F">Femme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-1/2">
                        <Input
                          placeholder="Date de naissance"
                          type="date"
                          value={registerData.date_naissance}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, date_naissance: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <Input
                      placeholder="Ville"
                      value={registerData.ville}
                      onChange={(e) => setRegisterData({ ...registerData, ville: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Quartier"
                      value={registerData.quartier}
                      onChange={(e) => setRegisterData({ ...registerData, quartier: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Mot de passe"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Confirmer mot de passe"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, confirmPassword: e.target.value })
                      }
                      required
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Inscription..." : "Créer un compte"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </div>
        </div>
      </main>
    </div>
  )
}

// ✅ Carte graphique
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="bg-white/90 text-black rounded-xl p-6 text-center shadow-md">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm">{desc}</p>
    </div>
  )
}

