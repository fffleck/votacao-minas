import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
})

// Interceptor para garantir que o token seja enviado em todas as requisições
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")

      if (token) {
        config.headers = config.headers || {}

        config.headers["Authorization"] = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)