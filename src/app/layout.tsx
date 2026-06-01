import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"

import { AuthProvider } from "@/app/context/authcontext"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "HealthSOD — Plateforme médicale intelligente",
  description: "Suivi médical connecté pour patients, médecins et encadreurs. Rendez-vous, symptômes, prescriptions et alertes épidémiologiques en temps réel.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}>
        {/* ✅ Fournir le contexte global à toute l'application */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
