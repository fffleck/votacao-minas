"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"
import axios from "axios"

const IMAGE_BASE = "http://localhost:3000"

type VotingStatus = "draft" | "open" | "closed"

export default function ManageVotingPage() {
  const { id } = useParams()
  const router = useRouter()

  const [steps, setSteps] = useState<any[]>([])
  const [votingTitle, setVotingTitle] = useState("")
  const [votingDescription, setVotingDescription] = useState("")
  const [votingStatus, setVotingStatus] = useState<VotingStatus>("draft")
  const [votingStartDate, setVotingStartDate] = useState("")
  const [votingEndDate, setVotingEndDate] = useState("")
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
    loadVoting()
    loadSteps()
  }, [])

  function formatDateTimeLocal(iso: string | null | undefined) {
    if (!iso) return ""
    const date = new Date(iso)
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return offsetDate.toISOString().slice(0, 16)
  }

  function getStatusLabel(status: string) {
    if (status === "open") return "ABERTA"
    if (status === "closed") return "FECHADA"
    return "RASCUNHO"
  }

  function getStatusColor(status: string) {
    if (status === "open") return "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
    if (status === "closed") return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
    return "text-zinc-600 bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-300"
  }

  async function loadVoting() {
    const res = await api.get(`/votings/${id}`)
    setVotingTitle(res.data.title || "")
    setVotingDescription(res.data.description || "")
    setVotingStatus(res.data.status || "draft")
    setVotingStartDate(formatDateTimeLocal(res.data.startDate))
    setVotingEndDate(formatDateTimeLocal(res.data.endDate))
  }

  async function loadSteps() {
    const res = await api.get(`/voting-steps/${id}`)
    setSteps(res.data)
  }

  async function handleSaveVoting() {
    if (!votingTitle.trim()) return alert("Informe o nome da votação")
    if (votingStartDate && votingEndDate && new Date(votingStartDate) >= new Date(votingEndDate)) {
      return alert("A data de início deve ser anterior à data de fim")
    }

    setLoading(true)
    try {
      const res = await api.patch(`/votings/${id}`, {
        title: votingTitle,
        description: votingDescription || null,
        status: votingStatus,
        startDate: votingStartDate || null,
        endDate: votingEndDate || null
      })

      setVotingTitle(res.data.title || "")
      setVotingDescription(res.data.description || "")
      setVotingStatus(res.data.status || "draft")
      setVotingStartDate(formatDateTimeLocal(res.data.startDate))
      setVotingEndDate(formatDateTimeLocal(res.data.endDate))
      alert("Informações da votação salvas com sucesso")
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao salvar informações da votação")
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mb-8">
            Gerenciar Etapas e Opções
          </h1>

          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">
                  Informações gerais da votação
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Edite nome, status e datas automáticas. As datas são opcionais.
                </p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(votingStatus)}`}>
                {getStatusLabel(votingStatus)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nome da votação
                </label>
                <input
                  className="w-full min-w-0 rounded border border-zinc-300 bg-zinc-50 p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Nome da votação"
                  value={votingTitle}
                  onChange={e => setVotingTitle(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Descrição
                </label>
                <textarea
                  className="min-h-24 w-full min-w-0 resize-y rounded border border-zinc-300 bg-zinc-50 p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Descrição opcional"
                  value={votingDescription}
                  onChange={e => setVotingDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  className="w-full min-w-0 rounded border border-zinc-300 bg-zinc-50 p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  value={votingStatus}
                  onChange={e => setVotingStatus(e.target.value as VotingStatus)}
                >
                  <option value="draft">Rascunho</option>
                  <option value="open">Aberta</option>
                  <option value="closed">Fechada</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Início automático
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full min-w-0 rounded border border-zinc-300 bg-zinc-50 p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    value={votingStartDate}
                    onChange={e => setVotingStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Fim automático
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full min-w-0 rounded border border-zinc-300 bg-zinc-50 p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    value={votingEndDate}
                    onChange={e => setVotingEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Deixe as datas em branco para controlar a abertura e o fechamento manualmente.
              </p>
              <button
                onClick={handleSaveVoting}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar informações
              </button>
            </div>
          </div>

          {/* Adicionar etapa */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-semibold mb-4 text-zinc-800 dark:text-zinc-100">Adicionar nova etapa</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_110px_110px]">
              <input
                className="min-w-0 border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100 sm:col-span-2 lg:col-span-1"
                placeholder="Título da etapa"
                value={stepTitle}
                onChange={e => setStepTitle(e.target.value)}
              />
              <select
                className="min-w-0 border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100"
                value={stepType}
                onChange={e => setStepType(e.target.value)}
              >
                <option value="single">Seleção única</option>
                <option value="multiple">Seleção múltipla</option>
              </select>
              <input
                type="number"
                min={1}
                className="min-w-0 border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100"
                placeholder="Mínimo"
                value={minSelect}
                onChange={e => setMinSelect(Number(e.target.value))}
              />
              <input
                type="number"
                min={1}
                className="min-w-0 border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100"
                placeholder="Máximo"
                value={maxSelect}
                onChange={e => setMaxSelect(Number(e.target.value))}
              />
              <button
                onClick={handleAddStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition sm:col-span-2 lg:col-span-4"
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  className="min-w-0 border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100"
                  value={selectedStep || ""}
                  onChange={e => setSelectedStep(e.target.value)}
                >
                  <option value="">Selecione a etapa</option>
                  {steps.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <input
                  className="min-w-0 border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-zinc-900 dark:text-zinc-100"
                  placeholder="Título da opção"
                  value={optionTitle}
                  onChange={e => setOptionTitle(e.target.value)}
                />
              </div>

              {/* Upload de imagem */}
              <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex flex-wrap items-center gap-2 cursor-pointer min-w-0">
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
                  <div className="relative shrink-0">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition disabled:opacity-50 sm:w-auto sm:self-end"
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
                  <div className="flex flex-col gap-3 mb-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 font-bold text-lg text-zinc-900 dark:text-zinc-100 break-words">{s.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs items-center lg:justify-end">
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
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition text-xs font-semibold"
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
                            className="flex max-w-full items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-1.5"
                          >
                            {o.imageUrl && (
                              <img
                                src={`${IMAGE_BASE}${o.imageUrl}`}
                                alt={o.label}
                                className="w-8 h-8 shrink-0 object-cover rounded"
                              />
                            )}
                            <span className="min-w-0 break-words text-sm font-medium text-blue-800 dark:text-blue-200">
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
                              className="shrink-0 bg-red-200 hover:bg-red-300 text-red-700 rounded-full px-2 py-0.5 text-xs font-bold transition"
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
            className="mt-8 rounded-lg bg-zinc-200 px-5 py-2 font-semibold text-zinc-800 shadow transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    </RequireAuth>
  )
}
