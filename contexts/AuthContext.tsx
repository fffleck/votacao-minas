"use client"

import { createContext, useState, useEffect, ReactNode } from "react"
import { api } from "@/services/api"

type AuthContextType = {
  user: any
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Restaurar token e user do localStorage ao carregar
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
    }
  }, [])

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login", {
      email,
      password
    })
    setUser(response.data.user)
    setToken(response.data.token)
    api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
    localStorage.setItem("token", response.data.token)
    localStorage.setItem("user", JSON.stringify(response.data.user))
  }

  function logout() {
    setUser(null)
    setToken(null)
    delete api.defaults.headers.common["Authorization"]
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}