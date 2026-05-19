"use client"

import { useState, useContext, useEffect } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowTutorial(false)
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [])

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

        <div className="mb-6 space-y-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center text-xl font-medium text-zinc-800 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-zinc-100">
          <p>
            Para executar o voto, entre com o email cadastrado no Sindicato.
          </p>

          <p>
            Veja o tutorial de como votar{" "}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              clicando aqui
            </button>
            .
          </p>
        </div>

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
            Em caso de dificuldade no acesso, procure a administração do Sindicato.
          </p>
        </div>
      </div>

      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tutorial de como votar"
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Tutorial de como votar
              </h2>
              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xl font-bold leading-none text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                aria-label="Fechar tutorial"
              >
                ×
              </button>
            </div>

            <video
              src="/videos/processo-votacao.webm"
              className="aspect-video w-full bg-black"
              controls
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  )
}
