"use client"

import { useEffect, useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/services/api"
import Link from "next/link"
import RequireAuth from "@/components/RequireAuth"
import LogoutButton from "@/components/LogoutButton"
import { AuthContext } from "@/contexts/AuthContext"

type Voting = {
  id: string
  title: string
  description?: string | null
  status: "open" | "closed" | "draft"
  startDate?: string | null
  endDate?: string | null
}

type AdminUser = {
  id: string
  name: string
  email: string
  cpf: string | null
  role: string
  voteCount: number
  hasVoted: boolean
  canChangePassword: boolean
}

const USER_PAGE_SIZE_OPTIONS = [10, 50, 100]

export default function Dashboard() {
  const { user, token } = useContext(AuthContext)
  const router = useRouter()
  const [votings, setVotings] = useState<Voting[]>([])
  const [votedIds, setVotedIds] = useState<string[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [userSearchEmail, setUserSearchEmail] = useState("")
  const [userSearchCpf, setUserSearchCpf] = useState("")
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserCpf, setNewUserCpf] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [creatingUser, setCreatingUser] = useState(false)
  const [loading, setLoading] = useState(true)

  const isVoter = user?.role === "VOTER"
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    if (token && user) load()
  }, [token, user])

  useEffect(() => {
    setUserPage(1)
  }, [userSearchEmail, userSearchCpf, userPageSize])

  async function load() {
    setLoading(true)
    try {
      const [votingsRes, myVotesRes, usersRes] = await Promise.all([
        api.get("/votings"),
        api.get("/votes/my-votes"),
        user?.role === "ADMIN" ? api.get("/users") : Promise.resolve({ data: [] })
      ])

      const loadedVotings: Voting[] = votingsRes.data
      const loadedVotedIds: string[] = myVotesRes.data.votedVotingIds

      setVotings(loadedVotings)
      setVotedIds(loadedVotedIds)
      setAdminUsers(usersRes.data)

      if (user?.role === "VOTER") {
        const openAndNotVoted = loadedVotings.filter(
          v => v.status === "open" && !loadedVotedIds.includes(v.id)
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

  function formatCpf(value: string | null | undefined) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
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

  function startPasswordEdit(userId: string) {
    setEditingUserId(userId)
    setNewPassword("")
  }

  function cancelPasswordEdit() {
    setEditingUserId(null)
    setNewPassword("")
  }

  function resetNewUserForm() {
    setNewUserName("")
    setNewUserEmail("")
    setNewUserCpf("")
    setNewUserPassword("")
  }

  async function handleCreateUser() {
    if (!newUserName.trim()) return alert("Informe o nome")
    if (!newUserEmail.trim()) return alert("Informe o email")
    if (newUserCpf.replace(/\D/g, "").length !== 11) return alert("Informe um CPF válido")
    if (newUserPassword.length < 5) return alert("A senha deve ter no mínimo 5 caracteres")

    setCreatingUser(true)
    try {
      await api.post("/users", {
        name: newUserName,
        email: newUserEmail,
        cpf: newUserCpf,
        password: newUserPassword
      })
      alert("Usuário cadastrado com sucesso")
      resetNewUserForm()
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao cadastrar usuário")
    } finally {
      setCreatingUser(false)
    }
  }

  async function handleSavePassword(userId: string) {
    if (newPassword.length < 5) return alert("A senha deve ter no mínimo 5 caracteres")

    try {
      await api.patch(`/users/${userId}/password`, { password: newPassword })
      alert("Senha alterada com sucesso")
      cancelPasswordEdit()
      load()
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao alterar senha")
    }
  }

  const openAndNotVoted = votings.filter(
    v => v.status === "open" && !votedIds.includes(v.id)
  )
  const voterAlreadyFinished = isVoter && votedIds.length > 0 && openAndNotVoted.length === 0
  const filteredUsers = adminUsers.filter(adminUser => {
    const emailMatch = adminUser.email.toLowerCase().includes(userSearchEmail.trim().toLowerCase())
    const cpfMatch = String(adminUser.cpf || "")
      .replace(/\D/g, "")
      .includes(userSearchCpf.replace(/\D/g, ""))

    return emailMatch && cpfMatch
  })
  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / userPageSize))
  const currentUserPage = Math.min(userPage, userPageCount)
  const firstUserIndex = (currentUserPage - 1) * userPageSize
  const paginatedUsers = filteredUsers.slice(firstUserIndex, firstUserIndex + userPageSize)

  return (
    <RequireAuth>
      {voterAlreadyFinished ? (
        <main className="min-h-screen bg-zinc-50 px-4 dark:bg-neutral-900">
          <header className="mx-auto flex h-[150px] max-w-4xl items-start justify-between">
            <img
              src="/assets/logo.jpeg"
              alt="Logo"
              className="mt-4 h-[118px] w-auto object-contain"
            />

            <div className="mt-4">
              <LogoutButton />
            </div>
          </header>

          <section className="mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center justify-center pb-20">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Você já executou seu voto.
              </h1>
              <p className="text-xl font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                Acompanhe os resultados pela página do Sindicato.
              </p>
            </div>
          </section>
        </main>
      ) : (
        <div className="min-h-screen bg-zinc-50 px-2 py-10 dark:bg-neutral-900">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
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
                    className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    Nova Votação
                  </Link>
                  <Link
                    href="/users"
                    className="rounded-lg bg-zinc-200 px-5 py-2 font-semibold text-zinc-800 shadow transition hover:bg-zinc-300"
                  >
                    Usuários
                  </Link>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-20 text-center text-zinc-500">Carregando...</div>
            ) : votings.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                {isVoter ? "Nenhuma votação disponível no momento." : "Nenhuma votação criada ainda."}
              </div>
            ) : (
              <div className="space-y-5">
                {votings.map(v => {
                  const alreadyVoted = votedIds.includes(v.id)

                  return (
                    <div
                      key={v.id}
                      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {v.title}
                          </h2>
                          <span className={`rounded-full px-2 py-1 text-xs font-bold ${getStatusColor(v.status)}`}>
                            {getStatusLabel(v.status)}
                          </span>
                          {alreadyVoted && (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              ✓ Voto realizado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {v.description || "Sem descrição"}
                        </p>
                        {(v.startDate || v.endDate) && (
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400 dark:text-zinc-500">
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
                        {v.status === "open" && (
                          alreadyVoted ? (
                            <span className="cursor-default rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                              Já votou
                            </span>
                          ) : (
                            <Link
                              href={`/vote/${v.id}`}
                              className="rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-200"
                            >
                              Votar
                            </Link>
                          )
                        )}

                        {isAdmin && (
                          <>
                            <Link
                              href={`/results/${v.id}`}
                              className="rounded-lg bg-purple-100 px-4 py-2 font-medium text-purple-700 transition hover:bg-purple-200"
                            >
                              Resultados
                            </Link>
                            <Link
                              href={`/dashboard/${v.id}/manage`}
                              className="rounded-lg bg-orange-100 px-4 py-2 font-medium text-orange-700 transition hover:bg-orange-200"
                            >
                              Gerenciar
                            </Link>
                            {(v.status === "closed" || v.status === "draft") && (
                              <button
                                onClick={() => handleOpen(v.id)}
                                className="rounded-lg bg-green-100 px-4 py-2 font-medium text-green-700 transition hover:bg-green-200"
                              >
                                Abrir
                              </button>
                            )}
                            {v.status === "open" && (
                              <button
                                onClick={() => handleClose(v.id)}
                                className="rounded-lg bg-red-100 px-4 py-2 font-medium text-red-700 transition hover:bg-red-200"
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
              <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Usuários aptos para votação
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Todos os usuários listados já podem fazer login. A senha inicial dos votantes migrados é formada pelos 5 últimos dígitos do CPF.
                  </p>
                </div>

                <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Cadastrar novo usuário
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="Nome"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="Email"
                      type="email"
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="CPF"
                      value={newUserCpf}
                      onChange={e => setNewUserCpf(formatCpf(e.target.value))}
                    />
                    <input
                      className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="Senha"
                      type="text"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                    />
                    <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleCreateUser}
                        disabled={creatingUser}
                        className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {creatingUser ? "Cadastrando..." : "Cadastrar usuário"}
                      </button>
                      <button
                        type="button"
                        onClick={resetNewUserForm}
                        className="rounded-lg bg-zinc-200 px-5 py-2 font-semibold text-zinc-800 shadow transition hover:bg-zinc-300"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-2">
                  <input
                    className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="Buscar por email"
                    type="email"
                    value={userSearchEmail}
                    onChange={e => setUserSearchEmail(e.target.value)}
                  />
                  <input
                    className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder="Buscar por CPF"
                    value={userSearchCpf}
                    onChange={e => setUserSearchCpf(formatCpf(e.target.value))}
                  />
                  <div className="flex flex-col gap-3 text-sm text-zinc-500 dark:text-zinc-400 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Exibindo {paginatedUsers.length} de {filteredUsers.length} usuários encontrados.
                    </span>
                    <label className="flex items-center gap-2">
                      <span>Por página:</span>
                      <select
                        className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        value={userPageSize}
                        onChange={e => setUserPageSize(Number(e.target.value))}
                      >
                        {USER_PAGE_SIZE_OPTIONS.map(size => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {adminUsers.length === 0 ? (
                  <div className="py-10 text-center text-zinc-400">
                    Nenhum usuário encontrado.
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-10 text-center text-zinc-400">
                    Nenhum usuário encontrado para essa busca.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                            <th className="py-3 pr-3">Nome</th>
                            <th className="py-3 pr-3">Email</th>
                            <th className="py-3 pr-3">CPF</th>
                            <th className="py-3 pr-3">Perfil</th>
                            <th className="py-3 pr-3">Voto</th>
                            <th className="py-3 text-right">Senha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUsers.map(adminUser => {
                            const canEditPassword =
                              adminUser.canChangePassword || (adminUser.role !== "ADMIN" && !adminUser.hasVoted)

                            return (
                            <tr key={adminUser.id} className="border-b border-zinc-100 dark:border-zinc-700">
                              <td className="py-3 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                                {adminUser.name}
                              </td>
                              <td className="py-3 pr-3 text-zinc-600 dark:text-zinc-300">
                                {adminUser.email}
                              </td>
                              <td className="py-3 pr-3 text-zinc-600 dark:text-zinc-300">
                                {adminUser.cpf ? formatCpf(adminUser.cpf) : "-"}
                              </td>
                              <td className="py-3 pr-3">
                                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                  {adminUser.role}
                                </span>
                              </td>
                              <td className="py-3 pr-3">
                                <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                                  adminUser.hasVoted
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                }`}>
                                  {adminUser.hasVoted ? "Já votou" : "Não votou"}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {canEditPassword ? (
                                  editingUserId === adminUser.id ? (
                                    <div className="ml-auto flex max-w-sm flex-col gap-2 sm:flex-row sm:justify-end">
                                      <input
                                        className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                                        placeholder="Nova senha"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSavePassword(adminUser.id)}
                                        className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white transition hover:bg-blue-700"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelPasswordEdit}
                                        className="rounded-lg bg-zinc-200 px-3 py-2 font-semibold text-zinc-800 transition hover:bg-zinc-300"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startPasswordEdit(adminUser.id)}
                                      className="font-medium text-blue-600 hover:underline"
                                    >
                                      Alterar senha
                                    </button>
                                  )
                                ) : (
                                  <span className="text-zinc-400 dark:text-zinc-500">
                                    Bloqueado
                                  </span>
                                )}
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        Página {currentUserPage} de {userPageCount}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUserPage(page => Math.max(1, page - 1))}
                          disabled={currentUserPage === 1}
                          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserPage(page => Math.min(userPageCount, page + 1))}
                          disabled={currentUserPage === userPageCount}
                          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </RequireAuth>
  )
}
