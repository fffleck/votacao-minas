"use client"

import { useState } from "react"
import { api } from "@/services/api"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [cpf, setCpf] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  async function handleRegister() {
    if (password.length < 6) {
      return alert("A senha deve ter no mínimo 6 caracteres")
    }

    if (password !== confirmPassword) {
      return alert("As senhas não conferem")
    }

    setLoading(true)
    try {
      await api.post("/auth/register", { name, email, cpf, password })
      alert("Cadastro realizado com sucesso! Faça login.")
      router.push("/login")
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao cadastrar")
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

        <p className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center text-2xl font-medium text-zinc-800 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-zinc-100">
          Para executar seu cadastro, você precisa preencher com o seu email cadastrado no sindicato e seu CPF. Escolha uma senha com no mínimo 6 caracteres.
        </p>

        <div className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-8 space-y-5">
          <h1 className="text-2xl font-bold text-center text-zinc-800 dark:text-zinc-100">
            Cadastro
          </h1>

          <input
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            type="email"
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CPF"
            value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))}
          />

          <input
            type="password"
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <input
            type="password"
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirme a senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleRegister()}
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Já tem conta?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
