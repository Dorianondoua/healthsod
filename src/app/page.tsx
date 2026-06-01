"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Calendar, Shield,
  LogOut, Menu, X, CheckCircle, ArrowRight, Activity,
} from "lucide-react"
import { useAuth } from "./context/authcontext"

// ─── Variants ──────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
}
const fadeSide = (dir: "left" | "right") => ({
  hidden: { opacity: 0, x: dir === "left" ? -36 : 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
})
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }

// ─── Scribble underline ─────────────────────────────────────────────────────
function Scribble({ width = 260 }: { width?: number }) {
  const w = width
  return (
    <motion.svg width={w} height={14} viewBox={`0 0 ${w} 14`} fill="none"
      className="absolute left-0 -bottom-1.5 pointer-events-none" aria-hidden>
      <motion.path
        d={`M2 9 C${w * 0.15} 3,${w * 0.35} 13,${w * 0.55} 7 C${w * 0.7} 2,${w * 0.85} 12,${w - 2} 6`}
        stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
      />
    </motion.svg>
  )
}

// ─── Hero mockup ────────────────────────────────────────────────────────────
function MockupDashboard() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.13)]">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <div className="flex-1 ml-3 h-5 rounded bg-gray-200/60 flex items-center px-2.5">
          <span className="text-[10px] text-gray-400 font-mono">healthsod.app · mon espace</span>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-0.5 text-base font-bold text-slate-950">Bonjour, Aïssatou 👋</div>
        <div className="text-[10px] text-gray-400 font-mono mb-4 tracking-wider">MARDI 27 MAI · 14:30</div>
        <div className="mb-3 rounded-2xl border border-cyan-200 bg-cyan-50/90 p-3.5 shadow-inner shadow-white">
          <div className="text-[9px] text-cyan-700 font-mono mb-1 tracking-widest">PROCHAIN RDV — DANS 2H</div>
          <div className="text-sm font-semibold text-gray-900 mb-0.5">Dr. Mensah · Cardiologie</div>
          <div className="text-xs text-gray-500">Téléconsultation · 16h30</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[["7.2k", "PAS"], ["65", "BPM"], ["8h", "SOMMEIL"]].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-slate-200/80 bg-slate-50 p-2.5">
              <div className="text-base font-black leading-tight text-slate-950">{v}</div>
              <div className="text-[9px] text-gray-400 font-mono mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-500">Symptômes — cette semaine</span>
            <span className="text-[10px] text-cyan-600 font-mono">↘ -12%</span>
          </div>
          <div className="flex items-end gap-1 h-9">
            {[60, 50, 70, 45, 35, 30, 20].map((h, i) => (
              <motion.div key={i}
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 1 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                style={{ height: `${h}%`, transformOrigin: "bottom" }}
                className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500 to-cyan-300"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feature mockups ────────────────────────────────────────────────────────
function MockupJournal() {
  return (
    <div className="-rotate-2 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <div className="text-[10px] text-cyan-600 font-mono mb-3 tracking-widest">JOURNAL DE SANTÉ</div>
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 mb-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">Aujourd'hui · 14h30</div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Fatigue</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">Migraine légère</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Bon moral</span>
        </div>
      </div>
      <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-3 mb-3">
        <div className="text-[9px] text-cyan-600 font-mono mb-1">✦ ANALYSE IA</div>
        <div className="text-xs text-gray-600 leading-relaxed">Migraines récurrentes le mardi. Recommandation : hydratation accrue.</div>
      </div>
      <div className="flex items-end gap-1 h-7">
        {[60, 50, 70, 45, 35, 30, 20].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-cyan-400" style={{ height: `${h}%`, opacity: 0.5 + h * 0.004 }} />
        ))}
      </div>
      <div className="text-[9px] text-gray-400 font-mono mt-1 text-center">7 DERNIERS JOURS</div>
    </div>
  )
}

function MockupMedecin() {
  const docs = [
    { init: "M", name: "Dr. Mensah", spec: "Cardiologie", rating: "4.9", info: "Disponible demain" },
    { init: "D", name: "Dr. Diallo", spec: "Médecine générale", rating: "4.8", info: "Aujourd'hui 16h" },
    { init: "K", name: "Dr. Koné", spec: "Pédiatrie", rating: "4.7", info: "Téléconsultation" },
  ]
  return (
    <div className="rotate-1 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5 mb-3 flex items-center gap-2">
        <span className="text-gray-400 text-sm">🔍</span>
        <span className="text-sm text-gray-400">Cardiologue, Dakar...</span>
      </div>
      <div className="space-y-2">
        {docs.map((d, i) => (
          <div key={d.name} className={`rounded-xl p-3 flex items-center justify-between border ${i === 1 ? "bg-cyan-50 border-cyan-200" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                {d.init}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{d.name}</div>
                <div className="text-[11px] text-gray-400">{d.spec}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-yellow-500">★ {d.rating}</div>
              <div className="text-[10px] text-cyan-600">{d.info}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupDossier() {
  return (
    <div className="-rotate-1 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-blue-600 font-mono tracking-widest">PARTAGE ACTIF</span>
          <span className="text-[9px] text-blue-500 font-mono">⏱ 48H RESTANTES</span>
        </div>
        <div className="text-sm font-semibold text-gray-800 mb-2">Partagé avec Dr. Mensah</div>
        <div className="h-1 rounded-full bg-blue-100">
          <div className="h-full w-3/5 rounded-full bg-blue-400" />
        </div>
      </div>
      {[["Ordonnance du 27/05", "🔒"], ["Bilan sanguin", "🔒"], ["IRM cervicale", "🔐"]].map(([name, icon]) => (
        <div key={name} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span className="text-sm text-gray-700">{name}</span>
          </div>
          <Shield className="w-3.5 h-3.5 text-blue-400" />
        </div>
      ))}
      <div className="mt-3 rounded-lg bg-gray-50 p-2.5">
        <div className="text-[9px] text-gray-400 font-mono mb-1">AUDIT LOG</div>
        <div className="text-[11px] text-gray-500">Dr. Mensah · Consultation ordo. · il y a 2h</div>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user, patient, login, register, logout } = useAuth()
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState<"login" | "register" | null>(null)
  const [loginData, setLoginData] = useState({
    email: "", password: "",
    role: "patient" as "patient" | "medecin" | "admin" | "encadreur",
  })
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [regData, setRegData] = useState({
    nom: "", email: "", telephone: "", numero: "",
    sexe: "M" as "M" | "F", date_naissance: "", ville: "", quartier: "",
    password: "", confirmPassword: "",
  })
  const [regError, setRegError] = useState<string | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const role = user.role?.toLowerCase()
    let path: string | null = null
    if (role === "patient" && patient) path = "/patient"
    else if (role === "medecin") path = "/medecin"
    else if (role === "admin") path = "/admin"
    else if (role === "encadreur") path = "/encadreur"
    if (!path) return
    setModal(null)
    const t = setTimeout(() => router.push(path!), 320)
    return () => clearTimeout(t)
  }, [user, patient, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true); setLoginError(null)
    const r = await login(loginData.email, loginData.password, loginData.role)
    if (!r.success) setLoginError(r.message || "Email ou mot de passe incorrect")
    setLoginLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regData.numero.length < 5) { setRegError("N° sécurité sociale : min 5 caractères"); return }
    if (regData.password !== regData.confirmPassword) { setRegError("Les mots de passe ne correspondent pas"); return }
    setRegLoading(true); setRegError(null)
    try { await register(regData); setModal("login") }
    catch (err: any) { setRegError(err.message || "Erreur lors de l'inscription") }
    finally { setRegLoading(false) }
  }

  // Section refs
  const featuresRef = useRef(null)
  const quoteRef = useRef(null)
  const stepsRef = useRef(null)
  const ctaRef = useRef(null)
  const featuresIn = useInView(featuresRef, { once: true, margin: "-60px" })
  const quoteIn = useInView(quoteRef, { once: true, margin: "-60px" })
  const stepsIn = useInView(stepsRef, { once: true, margin: "-60px" })
  const ctaIn = useInView(ctaRef, { once: true, margin: "-60px" })

  const features = [
    {
      num: "01", tag: "JOURNAL QUOTIDIEN", icon: Activity,
      title: "Notez vos symptômes en 30 secondes.",
      body: "Notre IA détecte les tendances avant même que vous les remarquiez. Recommandations personnalisées chaque semaine.",
      bullets: ["Saisie vocale ou texte", "Historique illimité", "Export PDF pour votre médecin"],
      Mockup: MockupJournal, reverse: false,
    },
    {
      num: "02", tag: "CONSULTATIONS", icon: Calendar,
      title: "Trouvez un médecin. Réservez en deux clics.",
      body: "500+ spécialistes vérifiés. Téléconsultation ou en cabinet. Filtres par disponibilité, distance et langue.",
      bullets: ["Avis vérifiés", "Téléconsultation HD", "Rappel automatique 24h avant"],
      Mockup: MockupMedecin, reverse: true,
    },
    {
      num: "03", tag: "DOSSIER MÉDICAL", icon: Shield,
      title: "Vos données. À votre rythme. Sous votre contrôle.",
      body: "Chiffrement AES-256. Vous décidez avec qui partager — et pour combien de temps. Conforme RGPD et HDS.",
      bullets: ["Partage temporaire", "Audit log complet", "Export à tout moment"],
      Mockup: MockupDossier, reverse: false,
    },
  ]

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
  const labelCls = "block text-xs text-gray-500 font-medium mb-1.5"

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <motion.nav
        initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50 px-4 pt-4"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_18px_70px_rgba(15,23,42,0.12)] ring-1 ring-slate-950/[0.03] backdrop-blur-xl md:px-6">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-900/15">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block text-[22px] font-black text-slate-950">
                Health<span className="text-cyan-600">SOD</span>
              </span>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.28em] text-slate-400 sm:block">
                Santé connectée
              </span>
            </div>
          </motion.div>

          <div className="hidden items-center gap-9 md:flex">
            <a href="#" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">Accueil</a>
            <a href="#features" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">Fonctionnalités</a>
            <a href="#" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">Parcours</a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={logout}
                className="flex h-12 items-center gap-2 rounded-2xl bg-cyan-600 px-6 text-sm font-bold text-white shadow-lg shadow-cyan-900/15 transition-colors hover:bg-cyan-700">
                Déconnexion <LogOut className="w-4 h-4" />
              </motion.button>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setModal("login")}
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950">
                  Se connecter
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setModal("register")}
                  className="flex h-9 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white shadow-md shadow-cyan-900/15 transition-colors hover:bg-cyan-700">
                  S'inscrire <ArrowRight className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 md:hidden">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
              className="mx-auto mt-2 flex max-w-7xl flex-col gap-4 overflow-hidden rounded-3xl border border-cyan-900/10 bg-white/94 px-6 py-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl md:hidden">
              <a href="#" className="text-sm font-semibold text-slate-500 hover:text-slate-950">Accueil</a>
              <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-slate-950">Fonctionnalités</a>
              <a href="#" className="text-sm font-semibold text-slate-500 hover:text-slate-950">Parcours</a>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setModal("login"); setMobileOpen(false) }}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">Se connecter</button>
                <button onClick={() => { setModal("register"); setMobileOpen(false) }}
                  className="flex-1 rounded-xl bg-cyan-600 py-2 text-sm font-bold text-white">S'inscrire</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(8,145,178,0.10),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 pb-16 pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="mb-6 flex items-center gap-3">
              <div className="h-px w-12 bg-cyan-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Pour les patients</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.65 }}
              className="mb-7 max-w-[720px] text-5xl font-black leading-[0.96] text-slate-950 md:text-[76px]">
              Reprenez<br />
              <span className="relative inline-block">
                <em className="not-italic text-cyan-600">le contrôle</em>
                <Scribble width={270} />
              </span>
              <br />de votre santé.
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="mb-9 max-w-xl text-xl leading-8 text-slate-600">
              HealthSOD rassemble vos consultations, vos analyses et vos médecins
              dans une seule application. Pensé pour vous.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setModal("register")}
                className="flex items-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)] transition-colors hover:bg-cyan-700">
                Commencer — c'est gratuit <ArrowRight className="w-4 h-4" />
              </motion.button>
              <span className="text-sm text-slate-400">ou{" "}
                <button onClick={() => setModal("login")}
                  className="font-semibold text-cyan-700 underline underline-offset-4 transition-colors hover:text-cyan-900">
                  se connecter
                </button>
              </span>
            </motion.div>

            {/* Trust strip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex items-center gap-10 border-t border-dashed border-slate-200 pt-6">
              {[["10K+", "PATIENTS"], ["500+", "MÉDECINS"], ["4.9★", "APP STORE"]].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-black leading-tight text-slate-950">{v}</div>
                  <div className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-slate-400">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — mockup */}
          <motion.div initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.75, ease: "easeOut" }} className="relative mx-auto w-full max-w-xl">
            <MockupDashboard />
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }} style={{ rotate: 8 }}
              className="absolute -right-2 -top-4 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 shadow-lg shadow-cyan-900/5">
              <span className="text-xs italic text-cyan-700">tout-en-un ✦</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ TRUST BAND ═══════════════════ */}
      <div className="border-y border-slate-200/80 bg-white/70 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8">
          <span className="whitespace-nowrap text-[10px] font-semibold tracking-[0.24em] text-slate-400">ILS NOUS FONT CONFIANCE</span>
          {["CHU Dakar", "Polyclinique Atlantique", "Mut. Santé+", "Pharma Group", "Croix Bleue"].map((p) => (
            <span key={p} className="cursor-default whitespace-nowrap text-base font-bold text-slate-300 transition-colors hover:text-slate-500">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="bg-white px-6 py-24" ref={featuresRef}>
        <div className="mx-auto max-w-7xl">
          <motion.div variants={stagger} initial="hidden" animate={featuresIn ? "visible" : "hidden"}
            className="mx-auto mb-20 max-w-2xl text-center">
            <motion.p variants={fadeUp} className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">— Le parcours patient —</motion.p>
            <motion.h2 variants={fadeUp} className="mb-5 text-4xl font-black leading-[0.98] text-slate-950 md:text-6xl">
              Une seule app.<br />Tout votre suivi.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg leading-8 text-slate-600">
              Découvrez comment HealthSOD vous accompagne, du symptôme à la guérison.
            </motion.p>
          </motion.div>

          <div>
            {features.map((f) => {
              const blockRef = useRef(null)
              const blockIn = useInView(blockRef, { once: true, margin: "-60px" })
              return (
                <div key={f.num} ref={blockRef}
                  className="grid grid-cols-1 items-center gap-12 border-t border-dashed border-slate-200 py-20 first:border-t-0 lg:grid-cols-2 lg:gap-20">
                  <motion.div variants={fadeSide(f.reverse ? "right" : "left")}
                    initial="hidden" animate={blockIn ? "visible" : "hidden"}
                    className={f.reverse ? "lg:order-2" : "lg:order-1"}>
                    <f.Mockup />
                  </motion.div>
                  <motion.div variants={fadeSide(f.reverse ? "left" : "right")}
                    initial="hidden" animate={blockIn ? "visible" : "hidden"}
                    className={f.reverse ? "lg:order-1" : "lg:order-2"}>
                    <div className="mb-5 flex items-center gap-4">
                      <span className="text-5xl font-black leading-none text-cyan-600">{f.num}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">— {f.tag}</span>
                    </div>
                    <h3 className="mb-4 max-w-xl text-4xl font-black leading-[1.04] text-slate-950">{f.title}</h3>
                    <p className="mb-7 max-w-xl text-lg leading-8 text-slate-600">{f.body}</p>
                    <ul className="mb-8 space-y-3">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 shrink-0 text-cyan-500" />
                          <span className="text-sm font-medium text-slate-600">{b}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-cyan-200 hover:text-slate-950">
                      En savoir plus →
                    </motion.button>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ QUOTE ═══════════════════ */}
      <section ref={quoteRef} className="border-y border-slate-200/80 bg-slate-950 px-6 py-24 text-white">
        <motion.div variants={stagger} initial="hidden" animate={quoteIn ? "visible" : "hidden"}
          className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeUp}
            className="mb-2 select-none text-[96px] font-black leading-none text-white/10" aria-hidden>"
          </motion.div>
          <motion.p variants={fadeUp}
            className="mx-auto mb-8 max-w-3xl text-2xl font-bold leading-snug text-white md:text-4xl">
            Avant HealthSOD, je perdais une heure par semaine à chercher mes ordonnances.
            Aujourd'hui, tout est à portée de main — et mes médecins ont toujours le contexte complet.
          </motion.p>
          <motion.div variants={fadeUp} className="mb-12 flex items-center justify-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-bold text-cyan-100 ring-1 ring-white/10">AD</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">Aïssatou Diallo</div>
              <div className="text-[10px] font-semibold tracking-[0.18em] text-white/40">PATIENTE · 8 MOIS D'UTILISATION</div>
            </div>
          </motion.div>
          <motion.div variants={stagger} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["« Indispensable pour mon père. »", "Mariam K."],
              ["« Le suivi à distance change tout. »", "Dr. Mensah"],
              ["« Alertes épidémiques très utiles. »", "Fatou N."],
            ].map(([q, n]) => (
              <motion.div key={n} variants={fadeUp}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left shadow-2xl shadow-black/10">
                <div className="flex gap-0.5 mb-3">
                  {Array(5).fill(0).map((_, i) => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                </div>
                <p className="mb-3 text-sm text-white/70">{q}</p>
                <div className="text-[10px] font-semibold tracking-[0.18em] text-white/35">— {n}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════ 3 STEPS ═══════════════════ */}
      <section className="bg-white px-6 py-24" ref={stepsRef}>
        <div className="mx-auto max-w-5xl">
          <motion.div variants={stagger} initial="hidden" animate={stepsIn ? "visible" : "hidden"}
            className="mb-10 text-center">
            <motion.p variants={fadeUp} className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">— Démarrer en 3 étapes —</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-950 md:text-5xl">
              Vous êtes à 90 secondes de mieux suivre votre santé.
            </motion.h2>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate={stepsIn ? "visible" : "hidden"}
            className="grid grid-cols-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:grid-cols-3">
            {[
              ["01", "Créez votre profil", "90 secondes — sans CB."],
              ["02", "Trouvez votre médecin", "500+ pros vérifiés."],
              ["03", "Suivez votre santé", "Dashboard centralisé."],
            ].map(([n, t, d], i) => (
              <div key={n}
                className={`border-b border-dashed border-slate-200 p-8 last:border-0 md:border-b-0 md:border-r ${i === 0 ? "bg-cyan-50/80" : "bg-white"}`}>
                <div className="mb-4 text-4xl font-black leading-none text-cyan-600">{n}</div>
                <div className="mb-1 text-base font-bold text-slate-950">{t}</div>
                <div className="text-sm text-slate-500">{d}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="bg-white px-6 py-24" ref={ctaRef}>
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={ctaIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_42%),#f8fafc] p-12 text-center shadow-[0_28px_90px_rgba(15,23,42,0.10)] md:p-16">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-slate-950/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h2 className="mb-4 text-4xl font-black leading-[1.02] text-slate-950 md:text-5xl">
              Votre prochaine consultation<br />commence ici.
            </h2>
            <p className="mx-auto mb-8 max-w-md text-base leading-7 text-slate-600">
              Rejoignez 10 000+ patients qui ont déjà choisi HealthSOD.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => setModal("register")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-8 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)] transition-colors hover:bg-cyan-700">
                Créer mon compte gratuit →
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={() => setModal("login")}
                className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-cyan-200 hover:text-slate-950">
                Déjà inscrit ?
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-14">
        <div className="mx-auto mb-10 grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600">
                <Activity className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-black text-slate-950">Health<span className="text-cyan-600">SOD</span></span>
            </div>
            <p className="max-w-[220px] text-sm leading-relaxed text-slate-500">
              La plateforme médicale qui vous remet au centre de votre santé.
            </p>
          </div>
          {[
            { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Sécurité", "API"] },
            { title: "Société", links: ["À propos", "Blog", "Carrières", "Contact"] },
            { title: "Légal", links: ["Confidentialité", "CGU", "Cookies", "Mentions légales"] },
          ].map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-800">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 md:flex-row">
          <p className="text-xs text-slate-400">© 2025 HealthSOD. Tous droits réservés.</p>
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-400">CONFORME RGPD · CERTIFIÉ HDS · AES-256</p>
        </div>
      </footer>

      {/* ═══════════════════ AUTH MODAL ═══════════════════ */}
      <AnimatePresence>
        {modal && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div key="modal"
              initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-0.5 bg-cyan-500" />
              <div className="p-7">
                <button onClick={() => setModal(null)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">HealthSOD</span>
                </div>
                {/* Tab switcher */}
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-6">
                  {(["login", "register"] as const).map((tab) => (
                    <button key={tab} onClick={() => setModal(tab)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${modal === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      {tab === "login" ? "Se connecter" : "S'inscrire"}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {modal === "login" && (
                    <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.16 }}
                      onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className={labelCls}>Rôle</label>
                        <select value={loginData.role} onChange={(e) => setLoginData({ ...loginData, role: e.target.value as any })} className={inputCls}>
                          <option value="patient">Patient</option>
                          <option value="medecin">Médecin</option>
                          <option value="admin">Administrateur</option>
                          <option value="encadreur">Encadreur</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" value={loginData.email} placeholder="vous@exemple.com" required
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Mot de passe</label>
                        <input type="password" value={loginData.password} placeholder="••••••••" required
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className={inputCls} />
                      </div>
                      {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
                      <button type="submit" disabled={loginLoading}
                        className="w-full py-3 rounded-xl font-semibold bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50">
                        {loginLoading ? "Connexion…" : "Se connecter"}
                      </button>
                      <p className="text-center text-xs text-gray-400">Pas encore de compte ?{" "}
                        <button type="button" onClick={() => setModal("register")} className="text-cyan-600 hover:text-cyan-800 transition-colors">S'inscrire</button>
                      </p>
                    </motion.form>
                  )}
                  {modal === "register" && (
                    <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}
                      onSubmit={handleRegister} className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                      <div>
                        <label className={labelCls}>Nom complet</label>
                        <input type="text" value={regData.nom} placeholder="Prénom Nom" required
                          onChange={(e) => setRegData({ ...regData, nom: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" value={regData.email} placeholder="vous@exemple.com" required
                          onChange={(e) => setRegData({ ...regData, email: e.target.value })} className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Téléphone</label>
                          <input type="tel" value={regData.telephone} placeholder="06 xx xx xx" required
                            onChange={(e) => setRegData({ ...regData, telephone: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>N° Sécu (min 5)</label>
                          <input type="text" value={regData.numero} placeholder="N° sécu" required minLength={5}
                            onChange={(e) => setRegData({ ...regData, numero: e.target.value })} className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Sexe</label>
                          <select value={regData.sexe} onChange={(e) => setRegData({ ...regData, sexe: e.target.value as "M" | "F" })} className={inputCls}>
                            <option value="M">Homme</option>
                            <option value="F">Femme</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Date de naissance</label>
                          <input type="date" value={regData.date_naissance} required
                            onChange={(e) => setRegData({ ...regData, date_naissance: e.target.value })} className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Ville</label>
                          <input type="text" value={regData.ville} placeholder="Ville" required
                            onChange={(e) => setRegData({ ...regData, ville: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Quartier</label>
                          <input type="text" value={regData.quartier} placeholder="Quartier" required
                            onChange={(e) => setRegData({ ...regData, quartier: e.target.value })} className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Mot de passe</label>
                        <input type="password" value={regData.password} placeholder="••••••••" required
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Confirmer le mot de passe</label>
                        <input type="password" value={regData.confirmPassword} placeholder="••••••••" required
                          onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })} className={inputCls} />
                      </div>
                      {regError && <p className="text-red-500 text-xs">{regError}</p>}
                      <button type="submit" disabled={regLoading}
                        className="w-full py-3 rounded-xl font-semibold bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50">
                        {regLoading ? "Inscription…" : "Créer mon compte"}
                      </button>
                      <p className="text-center text-xs text-gray-400">Déjà un compte ?{" "}
                        <button type="button" onClick={() => setModal("login")} className="text-cyan-600 hover:text-cyan-800 transition-colors">Se connecter</button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
