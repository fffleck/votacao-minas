"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"

type Option = { id: string; label: string }
type Step = { id: string; title: string; type: string; options: Option[] }
type OptionCount = { optionId: string; label: string; count: number }
type StepResult = { stepId: string; stepTitle: string; stepType: string; options: OptionCount[] }

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#ca8a04",
  "#db2777"
]

export default function ResultsPage() {
  const { id } = useParams()
  const router = useRouter()

  const [totalVotes, setTotalVotes] = useState(0)
  const [stepResults, setStepResults] = useState<StepResult[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [resultsRes, stepsRes] = await Promise.all([
        api.get(`/votes/${id}/results`),
        api.get(`/voting-steps/${id}`)
      ])

      const { totalVotes: total, votes } = resultsRes.data
      const steps: Step[] = stepsRes.data

      setTotalVotes(total)

      const aggregated: StepResult[] = steps.map(step => {
        const optionCounts: Record<string, number> = {}
        step.options.forEach(opt => { optionCounts[opt.id] = 0 })

        votes.forEach((answerSet: Record<string, string | string[]>) => {
          const ans = answerSet[step.id]
          if (!ans) return
          if (Array.isArray(ans)) {
            ans.forEach(optId => {
              if (optionCounts[optId] !== undefined) optionCounts[optId]++
            })
          } else {
            if (optionCounts[ans] !== undefined) optionCounts[ans]++
          }
        })

        return {
          stepId: step.id,
          stepTitle: step.title,
          stepType: step.type,
          options: step.options
            .map(opt => ({ optionId: opt.id, label: opt.label, count: optionCounts[opt.id] || 0 }))
            .sort((a, b) => b.count - a.count)
        }
      })

      setStepResults(aggregated)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      alert(error.response?.data?.error || "Erro ao carregar resultados")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  function getStepTotal(options: OptionCount[]) {
    return options.reduce((sum, opt) => sum + opt.count, 0)
  }

  function getPercent(count: number, total: number) {
    if (total === 0) return 0
    return parseFloat(((count / total) * 100).toFixed(1))
  }

  function getPieBackground(options: OptionCount[]) {
    const total = getStepTotal(options)
    if (total === 0) return "#e4e4e7"

    let cursor = 0
    const slices = options
      .filter(opt => opt.count > 0)
      .map((opt, index) => {
        const start = cursor
        const size = (opt.count / total) * 100
        cursor += size
        const color = CHART_COLORS[index % CHART_COLORS.length]
        return `${color} ${start}% ${cursor}%`
      })

    return `conic-gradient(${slices.join(", ")})`
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 py-10 px-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              Resultados
            </h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 hover:underline text-sm"
            >
              Voltar
            </button>
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
            Total de votos: <strong className="text-zinc-800 dark:text-zinc-100">{totalVotes}</strong>
          </p>

          {loading ? (
            <div className="text-center py-20 text-zinc-500">Carregando...</div>
          ) : stepResults.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">Nenhum resultado disponível ainda.</div>
          ) : (
            <div className="space-y-8">
              {stepResults.map((sr, index) => {
                const stepTotal = getStepTotal(sr.options)

                return (
                  <div
                    key={sr.stepId}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6"
                  >
                    <div className="flex flex-col gap-1 mb-6">
                      <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                        {index + 1}. {sr.stepTitle}
                      </h2>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Total nesta etapa: {stepTotal} {stepTotal === 1 ? "voto" : "votos"}
                        {sr.stepType === "multiple" ? " em opções selecionadas" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-center">
                      <div className="flex justify-center">
                        <div
                          className="relative w-64 h-64 rounded-full shadow-inner"
                          style={{ background: getPieBackground(sr.options) }}
                          aria-label={`Gráfico de pizza da etapa ${sr.stepTitle}`}
                        >
                          <div className="absolute inset-12 rounded-full bg-white dark:bg-zinc-800 flex flex-col items-center justify-center text-center border border-zinc-100 dark:border-zinc-700">
                            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                              {stepTotal}
                            </span>
                            <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              {stepTotal === 1 ? "voto" : "votos"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {sr.options.map((opt, i) => {
                          const pct = getPercent(opt.count, stepTotal)
                          const color = CHART_COLORS[i % CHART_COLORS.length]

                          return (
                            <div
                              key={opt.optionId}
                              className="flex flex-col gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className="w-4 h-4 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-medium text-zinc-800 dark:text-zinc-100 truncate">
                                    {opt.label}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                  {opt.count} {opt.count === 1 ? "voto" : "votos"} ({pct}%)
                                </span>
                              </div>

                              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
