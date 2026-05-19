"use client"

import { useState, useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch {
      alert("Email ou senha inválidos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 flex items-center justify-center px-4">
      <div className="w-full max-w-[31.2rem] flex flex-col items-center">
        <img
          src="/assets/logo.jpeg"
          alt="Logo"
          className="w-[110%] max-w-[110%] mb-6 object-contain"
        />

        <p className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center text-xl font-medium text-zinc-800 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-zinc-100">
          Para executar o voto é necessário se cadastrar. Para isso{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            clique aqui
          </Link>{" "}
          e siga as instruções na tela.
        </p>

        <div className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-8 space-y-5">
          <h1 className="text-2xl font-bold text-center text-zinc-800 dark:text-zinc-100">
            Entrar
          </h1>

          <input
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Não tem conta?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
