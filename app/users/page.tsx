"use client"

import { useEffect, useState, useContext } from "react"
import { api } from "@/services/api"
import RequireAuth from "@/components/RequireAuth"
import { AuthContext } from "@/contexts/AuthContext"
import Link from "next/link"

export default function UsersListPage() {
  const { user, token } = useContext(AuthContext)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && user?.role === "ADMIN") {
      load()
    }
  }, [token, user])

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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Usuários cadastrados</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline">Voltar</Link>
          </div>
          {loading ? (
            <div className="text-center py-10 text-zinc-500">Carregando...</div>
          ) : (
            <table className="w-full bg-white dark:bg-zinc-800 rounded-xl shadow overflow-hidden">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-700">
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Perfil</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-1 rounded-lg font-medium transition"
                      >
                        Desativar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
