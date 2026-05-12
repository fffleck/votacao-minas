"use client"

import { useState } from "react"
import { api } from "@/services/api"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/RequireAuth"

export default function NewVotingPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!title.trim()) return alert("Informe o título da votação")
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return alert("A data de início deve ser anterior à data de encerramento")
    }
    setLoading(true)
    try {
      const res = await api.post("/votings", {
        title,
        description,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      router.push(`/dashboard/${res.data.id}/manage`)
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao criar votação")
    } finally {
      setLoading(false)
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-8 space-y-5">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Nova Votação
          </h1>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título *</label>
            <input
              className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Eleição de diretoria 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
            <textarea
              className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descrição opcional"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Início automático
              </label>
              <input
                type="datetime-local"
                className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <p className="text-xs text-zinc-400">Opcional — abre automaticamente</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Encerramento automático
              </label>
              <input
                type="datetime-local"
                className="w-full border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
              <p className="text-xs text-zinc-400">Opcional — fecha automaticamente</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
            Se informar as datas, a votação abre e fecha automaticamente no horário definido.
            Sem datas, o controle é manual pelo dashboard.
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar e Gerenciar Etapas"}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full text-zinc-500 hover:text-zinc-700 underline text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </RequireAuth>
  )
}
