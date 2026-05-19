"use client"

import { useEffect, useState, useContext } from "react"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"
import { AuthContext } from "@/contexts/AuthContext"
import Link from "next/link"

type RegisteredUser = {
  id: string
  name: string
  email: string
  cpf?: string | null
  role: string
  createdAt: string
}

const USERS_PAGE_SIZE = 50

export default function UsersListPage() {
  const { user, token } = useContext(AuthContext)
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [searchEmail, setSearchEmail] = useState("")
  const [searchCpf, setSearchCpf] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && user?.role === "ADMIN") {
      load()
    }
  }, [token, user])

  useEffect(() => {
    setPage(1)
  }, [searchEmail, searchCpf])

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  async function load() {
    setLoading(true)
    try {
      const res = await api.get("/users")
      setUsers(res.data)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deseja desativar este usuário?")) return
    await api.delete(`/users/${id}`)
    load()
  }

  const filteredUsers = users.filter(registeredUser => {
    const emailMatch = registeredUser.email.toLowerCase().includes(searchEmail.trim().toLowerCase())
    const cpfMatch = (registeredUser.cpf || "").replace(/\D/g, "").includes(searchCpf.replace(/\D/g, ""))

    return emailMatch && cpfMatch
  })
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * USERS_PAGE_SIZE
  const paginatedUsers = filteredUsers.slice(firstIndex, firstIndex + USERS_PAGE_SIZE)

  if (user?.role !== "ADMIN") {
    return (
      <RequireAuth>
        <div className="max-w-xl mx-auto mt-20 text-center text-red-600 font-bold">Acesso negado</div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 dark:bg-neutral-900 py-10 px-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Usuários cadastrados</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline">Voltar</Link>
          </div>
          {loading ? (
            <div className="text-center py-10 text-zinc-500">Carregando...</div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-2">
                <input
                  className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-2 rounded-lg"
                  placeholder="Buscar por email"
                  type="email"
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                />
                <input
                  className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-2 rounded-lg"
                  placeholder="Buscar por CPF"
                  value={searchCpf}
                  onChange={e => setSearchCpf(formatCpf(e.target.value))}
                />
                <div className="text-sm text-zinc-500 dark:text-zinc-400 sm:col-span-2">
                  Exibindo {paginatedUsers.length} de {filteredUsers.length} usuários encontrados.
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-zinc-400">
                  Nenhum usuário encontrado para essa busca.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="bg-zinc-100 dark:bg-zinc-700">
                          <th className="p-3 text-left">Nome</th>
                          <th className="p-3 text-left">Email</th>
                          <th className="p-3 text-left">CPF</th>
                          <th className="p-3 text-left">Perfil</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map(registeredUser => (
                          <tr key={registeredUser.id} className="border-b border-zinc-200 dark:border-zinc-700">
                            <td className="p-3 text-zinc-900 dark:text-zinc-100 font-medium">
                              {registeredUser.name}
                            </td>
                            <td className="p-3 text-zinc-600 dark:text-zinc-300">
                              {registeredUser.email}
                            </td>
                            <td className="p-3 text-zinc-600 dark:text-zinc-300">
                              {registeredUser.cpf ? formatCpf(registeredUser.cpf) : "-"}
                            </td>
                            <td className="p-3 text-zinc-600 dark:text-zinc-300">
                              {registeredUser.role}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeactivate(registeredUser.id)}
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-1 rounded-lg font-medium transition"
                              >
                                Desativar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Página {currentPage} de {pageCount}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage(current => Math.max(1, current - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-zinc-300 px-4 py-2 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage(current => Math.min(pageCount, current + 1))}
                        disabled={currentPage === pageCount}
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
    </RequireAuth>
  )
}
