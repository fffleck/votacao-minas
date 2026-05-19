"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"
import axios from "axios"

const IMAGE_BASE = "http://localhost:3000"

export default function ManageVotingPage() {
  const { id } = useParams()
  const router = useRouter()

  const [steps, setSteps] = useState<any[]>([])
  const [stepTitle, setStepTitle] = useState("")
  const [stepType, setStepType] = useState("single")
  const [minSelect, setMinSelect] = useState(1)
  const [maxSelect, setMaxSelect] = useState(1)

  const [optionTitle, setOptionTitle] = useState("")
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [optionImageFile, setOptionImageFile] = useState<File | null>(null)
  const [optionImagePreview, setOptionImagePreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSteps()
  }, [])

  async function loadSteps() {
    const res = await api.get(`/voting-steps/${id}`)
    setSteps(res.data)
  }

  async function handleAddStep() {
    if (!stepTitle) return alert("Informe o título da etapa")
    setLoading(true)
    try {
      await api.post("/voting-steps/step", {
        votingId: id,
        title: stepTitle,
        type: stepType,
        minSelect: Number(minSelect),
        maxSelect: Number(maxSelect)
      })
      setStepTitle("")
      setStepType("single")
      setMinSelect(1)
      setMaxSelect(1)
      loadSteps()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao adicionar etapa")
    } finally {
      setLoading(false)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOptionImageFile(file)
    setOptionImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append("file", file)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(`${IMAGE_BASE}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      })
      return res.data.url
    } catch {
      alert("Erro ao fazer upload da imagem")
      return null
    }
  }

  async function handleAddOption() {
    if (!selectedStep) return alert("Selecione uma etapa")
    if (!optionTitle) return alert("Informe o título da opção")
    setLoading(true)
    try {
      let imageUrl: string | undefined = undefined
      if (optionImageFile) {
        const url = await uploadImage(optionImageFile)
        if (url) imageUrl = url
      }
      await api.post("/voting-steps/option", { stepId: selectedStep, label: optionTitle, imageUrl })
      setOptionTitle("")
      setOptionImageFile(null)
      setOptionImagePreview(null)
      loadSteps()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao adicionar opção")
    } finally {
      setLoading(false)
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 py-10 px-2">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mb-8">
            Gerenciar Etapas e Opções
          </h1>

          {/* Adicionar etapa */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-semibold mb-4 text-zinc-800 dark:text-zinc-100">Adicionar nova etapa</h2>
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <input
                className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded flex-1 text-zinc-900 dark:text-zinc-100"
                placeholder="Título da etapa"
                value={stepTitle}
                onChange={e => setStepTitle(e.target.value)}
              />
              <select
                className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100"
                value={stepType}
                onChange={e => setStepType(e.target.value)}
              >
                <option value="single">Seleção única</option>
                <option value="multiple">Seleção múltipla</option>
              </select>
              <input
                type="number"
                min={1}
                className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded w-24 text-zinc-900 dark:text-zinc-100"
                placeholder="Mínimo"
                value={minSelect}
                onChange={e => setMinSelect(Number(e.target.value))}
              />
              <input
                type="number"
                min={1}
                className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded w-24 text-zinc-900 dark:text-zinc-100"
                placeholder="Máximo"
                value={maxSelect}
                onChange={e => setMaxSelect(Number(e.target.value))}
              />
              <button
                onClick={handleAddStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
                disabled={loading}
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Adicionar opção */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-semibold mb-4 text-zinc-800 dark:text-zinc-100">Adicionar opção a uma etapa</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <select
                  className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded flex-1 text-zinc-900 dark:text-zinc-100"
                  value={selectedStep || ""}
                  onChange={e => setSelectedStep(e.target.value)}
                >
                  <option value="">Selecione a etapa</option>
                  {steps.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <input
                  className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded flex-1 text-zinc-900 dark:text-zinc-100"
                  placeholder="Título da opção"
                  value={optionTitle}
                  onChange={e => setOptionTitle(e.target.value)}
                />
              </div>

              {/* Upload de imagem */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">Imagem:</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer">
                    Escolher imagem
                  </span>
                </label>
                {optionImagePreview && (
                  <div className="relative">
                    <img
                      src={optionImagePreview}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-600"
                    />
                    <button
                      onClick={() => { setOptionImageFile(null); setOptionImagePreview(null) }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
                {!optionImagePreview && (
                  <span className="text-xs text-zinc-400">Nenhuma imagem selecionada</span>
                )}
              </div>

              <button
                onClick={handleAddOption}
                className="self-end bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Adicionando..." : "Adicionar Opção"}
              </button>
            </div>
          </div>

          {/* Etapas cadastradas */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4 text-zinc-800 dark:text-zinc-100">Etapas cadastradas</h2>
            <ul className="space-y-6">
              {steps.map((s: any) => (
                <li
                  key={s.id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-zinc-50 dark:bg-zinc-900"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{s.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs items-center">
                      <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded">
                        {s.type === "multiple" ? "Seleção múltipla" : "Seleção única"}
                      </span>
                      <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded">
                        Mín: {s.minSelect}
                      </span>
                      <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded">
                        Máx: {s.maxSelect}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm("Excluir esta etapa?")) {
                            setLoading(true)
                            try {
                              await api.delete(`/voting-steps/step/${s.id}`)
                              loadSteps()
                            } catch (err: any) {
                              alert(err.response?.data?.error || "Erro ao excluir etapa")
                            } finally {
                              setLoading(false)
                            }
                          }
                        }}
                        className="ml-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition text-xs font-semibold"
                      >
                        Excluir etapa
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">Opções:</span>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {s.options?.length ? (
                        s.options.map((o: any) => (
                          <div
                            key={o.id}
                            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-1.5"
                          >
                            {o.imageUrl && (
                              <img
                                src={`${IMAGE_BASE}${o.imageUrl}`}
                                alt={o.label}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              {o.label}
                            </span>
                            <button
                              onClick={async () => {
                                if (confirm("Excluir esta opção?")) {
                                  setLoading(true)
                                  try {
                                    await api.delete(`/voting-steps/option/${o.id}`)
                                    loadSteps()
                                  } catch (err: any) {
                                    alert(err.response?.data?.error || "Erro ao excluir opção")
                                  } finally {
                                    setLoading(false)
                                  }
                                }
                              }}
                              className="bg-red-200 hover:bg-red-300 text-red-700 rounded-full px-2 py-0.5 text-xs font-bold transition"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-sm">Nenhuma opção cadastrada</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-8 text-blue-600 underline"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    </RequireAuth>
  )
}
