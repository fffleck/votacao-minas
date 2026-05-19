"use client"

import RequireAuth from "@/components/RequireAuth"
import LogoutButton from "@/components/LogoutButton"

export default function VoteSuccessPage() {
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
          </div>
        </section>
      </main>
    </RequireAuth>
  )
}
