// lib/axios.ts
import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    console.log("INTERCEPTEUR: URL de la requête:", config.url)
    console.log("INTERCEPTEUR: Token dans localStorage:", token)
    if (token) {
      console.log("TOKEN UTILISÉ POUR LA REQUÊTE:", token)
      config.headers.Authorization = `Bearer ${token}`
      console.log("INTERCEPTEUR: Headers après ajout du token:", config.headers)
    } else {
      console.log("INTERCEPTEUR: Aucun token trouvé dans localStorage")
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
