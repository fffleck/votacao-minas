"use client"

import { useEffect, useState, useContext } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"
import { AuthContext } from "@/contexts/AuthContext"

const IMAGE_BASE = "http://localhost:3333"

type Option = { id: string; label: string; imageUrl?: string }
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

  const progressKey = `vote_progress_${id}_${user?.id}`

  useEffect(() => {
    if (user) loadData()
  }, [user])

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
      await api.post("/votes", { votingId: id, answers })
      localStorage.removeItem(progressKey)
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
    if (normalizedLabel === "branco / nulo" || normalizedLabel === "branco/nulo") {
      return { src: "/assets/nulo.jpeg", isSpecial: true }
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

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      currentStep.type === "single"
                        ? handleSingleSelect(currentStep.id, opt.id)
                        : handleMultiToggle(currentStep.id, opt.id)
                    }
                    className={`flex items-center rounded-xl border-2 p-3 transition focus:outline-none ${
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
                      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700">
                        <img
                          src={optionImage.src}
                          alt={opt.label}
                          className="h-full w-full object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-xs">
                        Sem imagem
                      </div>
                    )}

                    {/* Título centralizado */}
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 text-center leading-tight">
                      {opt.label}
                    </span>

                    {isSelected && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">✓ Selecionado</span>
                    )}
                  </button>
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
    </RequireAuth>
  )
}
