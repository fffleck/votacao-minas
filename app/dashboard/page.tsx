"use client"

import { useEffect, useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/services/api"
import Link from "next/link"
import RequireAuth from "@/components/RequireAuth"
import LogoutButton from "@/components/LogoutButton"
import { AuthContext } from "@/contexts/AuthContext"

type PreRegisteredUser = {
  id: string
  name: string
  email: string
  cpf: string
  status: "apto" | "inapto"
  registered: boolean
}

export default function Dashboard() {
  const { user, token } = useContext(AuthContext)
  const router = useRouter()
  const [votings, setVotings] = useState<any[]>([])
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [preRegisteredUsers, setPreRegisteredUsers] = useState<PreRegisteredUser[]>([])
  const [preName, setPreName] = useState("")
  const [preEmail, setPreEmail] = useState("")
  const [preCpf, setPreCpf] = useState("")
  const [preStatus, setPreStatus] = useState<"apto" | "inapto">("apto")
  const [editingPreId, setEditingPreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && user) load()
  }, [token, user])

  async function load() {
    setLoading(true)
    try {
      const [votingsRes, myVotesRes, preRegisteredRes] = await Promise.all([
        api.get("/votings"),
        api.get("/votes/my-votes"),
        user?.role === "ADMIN" ? api.get("/users/pre-registered") : Promise.resolve({ data: [] })
      ])

      const loadedVotings = votingsRes.data
      const loadedVotedIds: string[] = myVotesRes.data.votedVotingIds

      setVotings(loadedVotings)
      setVotedIds(loadedVotedIds)
      setPreRegisteredUsers(preRegisteredRes.data)

      // Regra 1: votante com apenas 1 votação aberta e ainda não votou → vai direto
      if (user?.role === "VOTER") {
        const openAndNotVoted = loadedVotings.filter(
          (v: any) => v.status === "open" && !loadedVotedIds.includes(v.id)
        )
        if (openAndNotVoted.length === 1) {
          router.replace(`/vote/${openAndNotVoted[0].id}`)
          return
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dashboard", err)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(iso: string | null | undefined) {
    if (!iso) return null
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  function resetPreForm() {
    setPreName("")
    setPreEmail("")
    setPreCpf("")
    setPreStatus("apto")
    setEditingPreId(null)
  }

  function handleEditPreRegistered(preUser: PreRegisteredUser) {
    setEditingPreId(preUser.id)
    setPreName(preUser.name)
    setPreEmail(preUser.email)
    setPreCpf(formatCpf(preUser.cpf))
    setPreStatus(preUser.status)
  }

  async function handleSavePreRegistered() {
    if (!preName.trim()) return alert("Informe o nome")
    if (!preEmail.trim()) return alert("Informe o email")
    if (preCpf.replace(/\D/g, "").length !== 11) return alert("Informe um CPF válido")

    try {
      const payload = {
        name: preName,
        email: preEmail,
        cpf: preCpf,
        status: preStatus
      }

      if (editingPreId) {
        await api.put(`/users/pre-registered/${editingPreId}`, payload)
      } else {
        await api.post("/users/pre-registered", payload)
      }

      resetPreForm()
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao salvar pré-cadastro")
    }
  }

  function getStatusLabel(status: string) {
    if (status === "open") return "ABERTA"
    if (status === "closed") return "ENCERRADA"
    return "RASCUNHO"
  }

  function getStatusColor(status: string) {
    if (status === "open") return "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
    if (status === "closed") return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
    return "text-zinc-600 bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-400"
  }

  async function handleOpen(id: string) {
    if (!confirm("Deseja abrir esta votação?")) return
    try {
      await api.post(`/votings/${id}/open`)
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao abrir votação")
    }
  }

  async function handleClose(id: string) {
    if (!confirm("Deseja fechar esta votação?")) return
    try {
      await api.post(`/votings/${id}/close`)
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao fechar votação")
    }
  }

  const isVoter = user?.role === "VOTER"
  const isAdmin = user?.role === "ADMIN"

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 py-10 px-2">
        <div className="max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
                Votações
              </h1>
              <LogoutButton />
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Link
                  href="/dashboard/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
                >
                  Nova Votação
                </Link>
                <Link
                  href="/users"
                  className="bg-zinc-200 hover:bg-zinc-300 text-zinc-800 px-5 py-2 rounded-lg font-semibold shadow transition"
                >
                  Usuários
                </Link>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500">Carregando...</div>
          ) : votings.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              {isVoter ? "Nenhuma votação disponível no momento." : "Nenhuma votação criada ainda."}
            </div>
          ) : (
            <div className="space-y-5">
              {votings.map(v => {
                const alreadyVoted = votedIds.includes(v.id)

                return (
                  <div
                    key={v.id}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                          {v.title}
                        </h2>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(v.status)}`}>
                          {getStatusLabel(v.status)}
                        </span>
                        {/* Badge "Voto realizado" */}
                        {alreadyVoted && (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            ✓ Voto realizado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {v.description || "Sem descrição"}
                      </p>
                      {(v.startDate || v.endDate) && (
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                          {v.startDate && (
                            <span>Início: <span className="font-medium text-zinc-600 dark:text-zinc-300">{formatDate(v.startDate)}</span></span>
                          )}
                          {v.endDate && (
                            <span>Encerramento: <span className="font-medium text-zinc-600 dark:text-zinc-300">{formatDate(v.endDate)}</span></span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">

                      {/* Botão votar — apenas para votações abertas */}
                      {v.status === "open" && (
                        alreadyVoted ? (
                          <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-medium px-4 py-2 rounded-lg text-sm cursor-default">
                            Já votou
                          </span>
                        ) : (
                          <Link
                            href={`/vote/${v.id}`}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium px-4 py-2 rounded-lg transition"
                          >
                            Votar
                          </Link>
                        )
                      )}

                      {/* Resultados — apenas para ADMIN */}
                      {isAdmin && (
                        <Link
                          href={`/results/${v.id}`}
                          className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium px-4 py-2 rounded-lg transition"
                        >
                          Resultados
                        </Link>
                      )}

                      {/* Ações de ADMIN */}
                      {isAdmin && (
                        <>
                          <Link
                            href={`/dashboard/${v.id}/manage`}
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium px-4 py-2 rounded-lg transition"
                          >
                            Gerenciar
                          </Link>
                          {(v.status === "closed" || v.status === "draft") && (
                            <button
                              onClick={() => handleOpen(v.id)}
                              className="bg-green-100 text-green-700 hover:bg-green-200 font-medium px-4 py-2 rounded-lg transition"
                            >
                              Abrir
                            </button>
                          )}
                          {v.status === "open" && (
                            <button
                              onClick={() => handleClose(v.id)}
                              className="bg-red-100 text-red-700 hover:bg-red-200 font-medium px-4 py-2 rounded-lg transition"
                            >
                              Fechar
                            </button>
                          )}
                        </>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {isAdmin && !loading && (
            <div className="mt-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Usuários pré-cadastrados
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Controle quem pode criar conta usando CPF.
                  </p>
                </div>
                {editingPreId && (
                  <button
                    onClick={resetPreForm}
                    className="text-sm text-zinc-500 hover:text-zinc-700 underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px_120px_auto] gap-3 mb-6">
                <input
                  className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2 rounded-lg"
                  placeholder="Nome"
                  value={preName}
                  onChange={e => setPreName(e.target.value)}
                />
                <input
                  className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2 rounded-lg"
                  placeholder="Email"
                  type="email"
                  value={preEmail}
                  onChange={e => setPreEmail(e.target.value)}
                />
                <input
                  className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2 rounded-lg"
                  placeholder="CPF"
                  value={preCpf}
                  onChange={e => setPreCpf(formatCpf(e.target.value))}
                />
                <select
                  className="border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2 rounded-lg"
                  value={preStatus}
                  onChange={e => setPreStatus(e.target.value as "apto" | "inapto")}
                >
                  <option value="apto">Apto</option>
                  <option value="inapto">Inapto</option>
                </select>
                <button
                  onClick={handleSavePreRegistered}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
                >
                  {editingPreId ? "Salvar" : "Adicionar"}
                </button>
              </div>

              {preRegisteredUsers.length === 0 ? (
                <div className="text-center py-10 text-zinc-400">
                  Nenhum usuário pré-cadastrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left text-zinc-500 dark:text-zinc-400">
                        <th className="py-3 pr-3">Nome</th>
                        <th className="py-3 pr-3">Email</th>
                        <th className="py-3 pr-3">CPF</th>
                        <th className="py-3 pr-3">Status</th>
                        <th className="py-3 pr-3">Cadastro</th>
                        <th className="py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preRegisteredUsers.map(preUser => (
                        <tr key={preUser.id} className="border-b border-zinc-100 dark:border-zinc-700">
                          <td className="py-3 pr-3 text-zinc-900 dark:text-zinc-100 font-medium">
                            {preUser.name}
                          </td>
                          <td className="py-3 pr-3 text-zinc-600 dark:text-zinc-300">
                            {preUser.email}
                          </td>
                          <td className="py-3 pr-3 text-zinc-600 dark:text-zinc-300">
                            {formatCpf(preUser.cpf)}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              preUser.status === "apto"
                                ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              {preUser.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              preUser.registered
                                ? "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-zinc-600 bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}>
                              {preUser.registered ? "Já se cadastrou" : "Pendente"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {!preUser.registered ? (
                              <button
                                onClick={() => handleEditPreRegistered(preUser)}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                Editar
                              </button>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500">
                                Bloqueado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </RequireAuth>
  )
}
