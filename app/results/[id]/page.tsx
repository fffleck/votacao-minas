"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"

type Option = { id: string; label: string }
type Step = { id: string; title: string; type: string; options: Option[] }
type OptionCount = { optionId: string; label: string; count: number }
type StepResult = { stepId: string; stepTitle: string; stepType: string; options: OptionCount[] }
type AdminUser = {
  id: string
  role: string
}
type SummaryMetric = {
  label: string
  count: number
  color: string
}
type VoteTimelinePoint = {
  hour: string
  count: number
}

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
  const [eligibleUsersTotal, setEligibleUsersTotal] = useState(0)
  const [voteTimeline, setVoteTimeline] = useState<VoteTimelinePoint[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [resultsRes, stepsRes, usersRes] = await Promise.all([
        api.get(`/votes/${id}/results`),
        api.get(`/voting-steps/${id}`),
        api.get("/users")
      ])

      const { totalVotes: total, votes, voteTimeline: timeline = [] } = resultsRes.data
      const steps: Step[] = stepsRes.data
      const users: AdminUser[] = usersRes.data
      const eligibleUsers = users.filter(user => user.role !== "ADMIN")

      setTotalVotes(total)
      setEligibleUsersTotal(eligibleUsers.length)
      setVoteTimeline(timeline)

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

  function getMetricTotal(items: SummaryMetric[]) {
    return items.reduce((sum, item) => sum + item.count, 0)
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

  function getMetricPieBackground(items: SummaryMetric[]) {
    const total = getMetricTotal(items)
    if (total === 0) return "#e4e4e7"

    let cursor = 0
    const slices = items
      .filter(item => item.count > 0)
      .map(item => {
        const start = cursor
        const size = (item.count / total) * 100
        cursor += size
        return `${item.color} ${start}% ${cursor}%`
      })

    return `conic-gradient(${slices.join(", ")})`
  }

  function renderSummaryChart(title: string, centerValue: number, centerLabel: string, items: SummaryMetric[]) {
    const total = getMetricTotal(items)

    return (
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-5">
          {title}
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] items-center">
          <div className="flex justify-center">
            <div
              className="relative h-52 w-52 rounded-full shadow-inner"
              style={{ background: getMetricPieBackground(items) }}
              aria-label={`Gráfico de ${title}`}
            >
              <div className="absolute inset-11 rounded-full bg-white dark:bg-zinc-800 flex flex-col items-center justify-center text-center border border-zinc-100 dark:border-zinc-700">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {centerValue}
                </span>
                <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {centerLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map(item => {
              const pct = getPercent(item.count, total)

              return (
                <div
                  key={item.label}
                  className="flex flex-col gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">
                        {item.label}
                      </span>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.count} ({pct}%)
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function formatTimelineHour(hour: string) {
    return new Date(hour).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  function renderTimelineChart() {
    const width = 900
    const height = 280
    const padding = 42
    const maxCount = Math.max(...voteTimeline.map(point => point.count), 1)
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const points = voteTimeline.map((point, index) => {
      const x = voteTimeline.length === 1
        ? width / 2
        : padding + (index / (voteTimeline.length - 1)) * chartWidth
      const y = padding + chartHeight - (point.count / maxCount) * chartHeight

      return { ...point, x, y }
    })
    const polylinePoints = points.map(point => `${point.x},${point.y}`).join(" ")

    return (
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-md p-6">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
            Linha do tempo da votação
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Votos registrados de hora em hora.
          </span>
        </div>

        {voteTimeline.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            Nenhum voto registrado para montar a linha do tempo.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-72 min-w-[760px] w-full"
                role="img"
                aria-label="Gráfico de linha com votos por hora"
              >
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d4d4d8" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d4d4d8" />

                {[0, 0.25, 0.5, 0.75, 1].map(mark => {
                  const y = padding + chartHeight - mark * chartHeight
                  const value = Math.round(maxCount * mark)

                  return (
                    <g key={mark}>
                      <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e4e4e7" strokeDasharray="4 6" />
                      <text x={padding - 12} y={y + 4} textAnchor="end" className="fill-zinc-500 text-xs">
                        {value}
                      </text>
                    </g>
                  )
                })}

                {points.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                )}

                {points.map((point, index) => (
                  <g key={point.hour}>
                    <circle cx={point.x} cy={point.y} r="7" fill="#2563eb" />
                    <text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-zinc-900 text-xs font-semibold dark:fill-zinc-100">
                      {point.count}
                    </text>
                    {(index === 0 || index === points.length - 1 || points.length <= 8) && (
                      <text x={point.x} y={height - padding + 24} textAnchor="middle" className="fill-zinc-500 text-xs">
                        {formatTimelineHour(point.hour)}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {voteTimeline.map(point => (
                <div
                  key={point.hour}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {formatTimelineHour(point.hour)}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {point.count} {point.count === 1 ? "voto" : "votos"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
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

          {loading ? (
            <div className="text-center py-20 text-zinc-500">Carregando...</div>
          ) : (
            <div className="space-y-8">
              {stepResults.length === 0 && (
                <div className="text-center py-20 text-zinc-400">Nenhum resultado de voto disponível ainda.</div>
              )}

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

              <div className="space-y-6">
                {renderSummaryChart(
                  "Participação na votação",
                  totalVotes,
                  "votaram",
                  [
                    { label: "Já votaram", count: totalVotes, color: "#9333ea" },
                    {
                      label: "Faltam votar",
                      count: Math.max(eligibleUsersTotal - totalVotes, 0),
                      color: "#dc2626"
                    }
                  ]
                )}

                {renderSummaryChart(
                  "Usuários aptos",
                  eligibleUsersTotal,
                  "pessoas",
                  [
                    { label: "Aptos para login e votação", count: eligibleUsersTotal, color: "#2563eb" }
                  ]
                )}
              </div>

              {renderTimelineChart()}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
