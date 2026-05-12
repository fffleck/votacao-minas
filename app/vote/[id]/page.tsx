"use client"

import { useEffect, useState, useContext } from "react"
import { useParams, useRouter } from "next/navigation"
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
      alert("Voto registrado com sucesso!")
      router.push("/dashboard")
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao votar")
    } finally {
      setSubmitting(false)
    }
  }

  function handleSaveAndExit() {
    saveProgress(answers, completedStepIds)
    router.push("/dashboard")
  }

  function handleExitWithoutVoting() {
    if (!confirm("Deseja sair sem registrar o voto? Sua sessão será encerrada.")) return
    localStorage.removeItem(progressKey)
    logout()
    router.push("/login")
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
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Título da votação */}
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mb-1">
            {voting?.title}
          </h1>
          {voting?.description && (
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">{voting.description}</p>
          )}

          {/* Indicador de etapas */}
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

          {/* Card da etapa atual */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6">
            <h2 className="font-semibold text-xl text-zinc-900 dark:text-zinc-100 mb-1">
              {currentStep.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              {currentStep.type === "single"
                ? "Selecione uma opção"
                : `Selecione entre ${currentStep.minSelect} e ${currentStep.maxSelect} opções`}
            </p>

            {/* Grid de opções — máx 4 colunas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentStep.options.map(opt => {
                const isSelected =
                  currentStep.type === "single"
                    ? answers[currentStep.id] === opt.id
                    : (answers[currentStep.id] as string[])?.includes(opt.id)

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      currentStep.type === "single"
                        ? handleSingleSelect(currentStep.id, opt.id)
                        : handleMultiToggle(currentStep.id, opt.id)
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition focus:outline-none ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900"
                    }`}
                  >
                    {/* Imagem ou placeholder */}
                    {opt.imageUrl ? (
                      <img
                        src={`${IMAGE_BASE}${opt.imageUrl}`}
                        alt={opt.label}
                        className="w-full aspect-square object-contain rounded-lg bg-zinc-100 dark:bg-zinc-700"
                      />
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

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSaveAndExit}
              className="w-full bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-semibold py-3 rounded-xl transition"
            >
              Salvar e sair
            </button>

            <button
              onClick={handleExitWithoutVoting}
              className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold py-3 rounded-xl transition"
            >
              Sair sem votar
            </button>
          </div>

        </div>
      </div>
    </RequireAuth>
  )
}
