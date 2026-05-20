"use client"

import { useEffect, useState } from "react"
import RequireAuth from "@/components/RequireAuth"
import LogoutButton from "@/components/LogoutButton"

type VoteReceipt = {
  voteId: string
  createdAt: string
}

export default function VoteSuccessPage() {
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null)

  useEffect(() => {
    const savedReceipt = sessionStorage.getItem("last_vote_receipt")
    if (!savedReceipt) return

    try {
      setReceipt(JSON.parse(savedReceipt))
    } catch {
      setReceipt(null)
    }
  }, [])

  function formatVoteDate(value: string) {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  const voteCode = receipt?.voteId?.slice(0, 8).toUpperCase()

  return (
    <RequireAuth>
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
              Obrigado pela sua participação.
            </h1>
            <p className="text-xl font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
              Seu voto foi realizado com sucesso.
            </p>

            {receipt && (
              <div className="mt-8 rounded-lg border border-zinc-200 bg-white px-6 py-5 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Comprovante de registro
                </p>
                <dl className="mt-4 space-y-3 text-zinc-700 dark:text-zinc-200">
                  <div>
                    <dt className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      Data e horário
                    </dt>
                    <dd className="text-lg font-bold">
                      {formatVoteDate(receipt.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      Código identificador
                    </dt>
                    <dd className="text-lg font-bold tracking-wider">
                      {voteCode}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </section>
      </main>
    </RequireAuth>
  )
}
