"use client"

import { useEffect, useState, useContext } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"
import { AuthContext } from "@/contexts/AuthContext"

const IMAGE_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "")

type Option = { id: string; label: string; imageUrl?: string; hideLabel?: boolean }
type Step = {
  id: string
  title: string
  type: "single" | "multiple"
  minSelect: number
  maxSelect: number
  options: Option[]
}

type VoteProgress = {
  answers: Record<string, string | string[]>
  completedStepIds: string[]
}

export default function VotePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, logout } = useContext(AuthContext)

  const [voting, setVoting] = useState<any>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [zoomedOption, setZoomedOption] = useState<Option | null>(null)

  const progressKey = `vote_progress_${id}_${user?.id}`

  useEffect(() => {
    if (user) loadData()
  }, [user])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomedOption(null)
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [])

  async function loadData() {
    try {
      const [votingRes, stepsRes] = await Promise.all([
        api.get(`/votings/${id}`),
        api.get(`/voting-steps/${id}`)
      ])
      setVoting(votingRes.data)
      const loadedSteps: Step[] = stepsRes.data
      setSteps(loadedSteps)

      const saved = localStorage.getItem(progressKey)
      if (saved) {
        const progress: VoteProgress = JSON.parse(saved)
        const validCompleted = progress.completedStepIds.filter(sid =>
          loadedSteps.some(s => s.id === sid)
        )
        setAnswers(progress.answers)
        setCompletedStepIds(validCompleted)
        const firstIncomplete = loadedSteps.findIndex(s => !validCompleted.includes(s.id))
        setCurrentStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0)
      } else {
        const initial: Record<string, string | string[]> = {}
        loadedSteps.forEach(step => {
          initial[step.id] = step.type === "multiple" ? [] : ""
        })
        setAnswers(initial)
        setCurrentStepIndex(0)
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao carregar votação")
    } finally {
      setLoading(false)
    }
  }

  function saveProgress(newAnswers: Record<string, string | string[]>, newCompleted: string[]) {
    localStorage.setItem(progressKey, JSON.stringify({
      answers: newAnswers,
      completedStepIds: newCompleted
    }))
  }

  function handleSingleSelect(stepId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [stepId]: optionId }))
  }

  function handleMultiToggle(stepId: string, optionId: string) {
    setAnswers(prev => {
      const current = (prev[stepId] as string[]) || []
      const already = current.includes(optionId)
      return { ...prev, [stepId]: already ? current.filter(x => x !== optionId) : [...current, optionId] }
    })
  }

  function validateCurrentStep(): boolean {
    const step = steps[currentStepIndex]
    const ans = answers[step.id]
    if (!ans || (Array.isArray(ans) && ans.length === 0) || ans === "") {
      alert(`Responda a etapa: "${step.title}"`)
      return false
    }
    if (step.type === "multiple" && Array.isArray(ans)) {
      if (ans.length < step.minSelect || ans.length > step.maxSelect) {
        alert(`Etapa "${step.title}": selecione entre ${step.minSelect} e ${step.maxSelect} opções`)
        return false
      }
    }
    return true
  }

  function handleNext() {
    if (!validateCurrentStep()) return
    const step = steps[currentStepIndex]
    const newCompleted = [...completedStepIds, step.id]
    setCompletedStepIds(newCompleted)
    saveProgress(answers, newCompleted)
    setCurrentStepIndex(prev => prev + 1)
  }

  function handleBack() {
    const prevStep = steps[currentStepIndex - 1]
    const newCompleted = completedStepIds.filter(sid => sid !== prevStep.id)
    setCompletedStepIds(newCompleted)
    saveProgress(answers, newCompleted)
    setCurrentStepIndex(prev => prev - 1)
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return
    setSubmitting(true)
    try {
      const response = await api.post("/votes", { votingId: id, answers })
      localStorage.removeItem(progressKey)
      sessionStorage.setItem("last_vote_receipt", JSON.stringify({
        voteId: response.data.id,
        createdAt: response.data.createdAt
      }))
      router.push("/vote/success")
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao votar")
    } finally {
      setSubmitting(false)
    }
  }

  function handleExitWithoutVoting() {
    if (!confirm("Deseja sair sem registrar o voto? Sua sessão será encerrada.")) return
    localStorage.removeItem(progressKey)
    logout()
    router.push("/login")
  }

  function getOptionImage(option: Option) {
    const normalizedLabel = option.label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()

    if (normalizedLabel === "sim") return { src: "/assets/positivo.png", isSpecial: true }
    if (normalizedLabel === "nao") return { src: "/assets/negativo.png", isSpecial: true }
    if (
      normalizedLabel === "nulo" ||
      normalizedLabel === "branco / nulo" ||
      normalizedLabel === "branco/nulo"
    ) {
      return { src: "/assets/nulo.png", isSpecial: true }
    }

    return option.imageUrl ? { src: `${IMAGE_BASE}${option.imageUrl}`, isSpecial: false } : null
  }

  if (loading || !user) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 flex items-center justify-center">
          <div className="text-zinc-500">Carregando...</div>
        </div>
      </RequireAuth>
    )
  }

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900">
        <header className="h-[150px]">
          <div className="mx-auto flex h-full max-w-4xl items-start justify-between px-4">
            <img
              src="/assets/logo.jpeg"
              alt="Logo"
              className="mt-4 h-[118px] w-auto object-contain"
            />

            <button
              onClick={handleExitWithoutVoting}
              className="mt-4 rounded-lg bg-red-100 px-5 py-2 font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-10">

          {/* Título da votação */}
          <h1 className="text-center text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mb-1">
            {voting?.title}
          </h1>
          {voting?.description && (
            <p className="text-center text-zinc-500 dark:text-zinc-400 mb-6">{voting.description}</p>
          )}

          {steps.length > 1 && (
            <div className="flex items-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < currentStepIndex
                      ? "bg-green-500 text-white"
                      : i === currentStepIndex
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  }`}>
                    {i < currentStepIndex ? "✓" : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-1 w-10 rounded-full transition-colors ${
                      i < currentStepIndex ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                    }`} />
                  )}
                </div>
              ))}
              <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">
                Etapa {currentStepIndex + 1} de {steps.length}
              </span>
            </div>
          )}

          {/* Card da etapa atual */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6">
            <h2 className="font-semibold text-xl text-zinc-900 dark:text-zinc-100 mb-1">
              {currentStep.title}
            </h2>
            {currentStepIndex === 0 && (
              <>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Antes de executar seu voto, conheça a chapa
                  </p>
                  <Link
                    href="/knowme"
                    className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    Conhecer chapa
                  </Link>
                </div>

                <div className="mb-6 flex justify-center">
                  <img
                    src="/assets/logo_chapa.png"
                    alt="Logo da chapa"
                    className="w-full max-w-md object-contain"
                  />
                </div>
              </>
            )}

            {/* Grid de opções — máx 4 colunas */}
            <div className={`grid gap-4 ${
              currentStep.options.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            }`}>
              {currentStep.options.map(opt => {
                const isSelected =
                  currentStep.type === "single"
                    ? answers[currentStep.id] === opt.id
                    : (answers[currentStep.id] as string[])?.includes(opt.id)
                const optionImage = getOptionImage(opt)

                function selectOption() {
                  currentStep.type === "single"
                    ? handleSingleSelect(currentStep.id, opt.id)
                    : handleMultiToggle(currentStep.id, opt.id)
                }

                return (
                  <div
                    key={opt.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={selectOption}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        selectOption()
                      }
                    }}
                    className={`flex cursor-pointer items-center rounded-xl border-2 p-3 transition focus:outline-none ${
                      optionImage?.isSpecial ? "min-h-24 flex-row justify-center gap-4" : "flex-col gap-2"
                    } ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    {/* Imagem ou placeholder */}
                    {optionImage?.isSpecial ? (
                      <img
                        src={optionImage.src}
                        alt=""
                        className="h-12 w-12 object-contain"
                      />
                    ) : optionImage ? (
                      <div className="relative flex aspect-square w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                        <img
                          src={optionImage.src}
                          alt={opt.label}
                          className="h-full w-full object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          aria-label={`Ver foto ampliada de ${opt.label}`}
                          title="Ver foto ampliada"
                          onClick={event => {
                            event.stopPropagation()
                            setZoomedOption(opt)
                          }}
                          className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.61 9.65l3.87 3.87a.75.75 0 1 0 1.06-1.06l-3.87-3.87A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-xs">
                        Sem imagem
                      </div>
                    )}

                    {/* Título centralizado */}
                    {!opt.hideLabel && (
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 text-center leading-tight">
                        {opt.label}
                      </span>
                    )}

                    {isSelected && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">✓ Selecionado</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Botões de navegação */}
          <div className="mt-6 flex gap-3">
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 font-semibold py-3 rounded-xl transition"
              >
                ← Voltar
              </button>
            )}
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow transition disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Confirmar Voto"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow transition"
              >
                Próximo →
              </button>
            )}
          </div>

        </div>
      </div>

      {zoomedOption && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${zoomedOption.label}`}
          onClick={() => setZoomedOption(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-[39.2rem] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedOption(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-lg font-bold leading-none text-white transition hover:bg-black"
              aria-label="Fechar"
            >
              ×
            </button>

            <img
              src={getOptionImage(zoomedOption)?.src}
              alt={zoomedOption.label}
              className="max-h-[92vh] w-full object-contain"
            />

            {!zoomedOption.hideLabel && (
              <p className="p-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {zoomedOption.label}
              </p>
            )}
          </div>
        </div>
      )}
    </RequireAuth>
  )
}
