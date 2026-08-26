"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const members = [
  { name: "Janine Koneski de Abreu", image: "01-janine_koneski_de_abreu.png", x: 13.53, y: 28.42 },
  { name: "Celso Vicenzi", image: "02_celso_vicenzi.png", x: 31.5, y: 28.42 },
  { name: "Cristina De Marco", image: "03_cristina_de_marco.png", x: 49.46, y: 28.42 },
  { name: "Adriana Baldissarelli", image: "04_adriana_baldissarelli.png", x: 68.46, y: 28.42 },
  { name: "Cárlida Emerim", image: "05_carlida_emerim.png", x: 86.38, y: 28.42 },
  { name: "Magali Moser", image: "06_magali_moser.png", x: 13.53, y: 41.72 },
  { name: "Hilton Maurente", image: "07_hilton_maurente.png", x: 31.5, y: 41.72 },
  { name: "Silvia Agostini", image: "08_silvia_agostini.png", x: 49.46, y: 41.72 },
  { name: "Andrieli Trindade", image: "09_andrieli_trindade.png", x: 68.46, y: 41.72 },
  { name: "Gilvan de França", image: "10_gilvan_de_franca.png", x: 86.38, y: 41.72 },
  { name: "Rita Paulino", image: "11_rita_paulino.png", x: 13.53, y: 54.59 },
  { name: "Fernando Evangelista", image: "12_fernando_evangelista.png", x: 31.5, y: 54.59 },
  { name: "Josemar Sehnem", image: "13_josemar_sehnem.png", x: 49.46, y: 54.59 },
  { name: "Marli Vitali", image: "14_marli_vitali.png", x: 68.46, y: 54.59 },
  { name: "Rogério Christofoletti", image: "15_rogerio_christofoletti.png", x: 86.38, y: 54.59 },
  { name: "Ivan Giacomelli", image: "16_ivan_giacomelli.png", x: 13.53, y: 67.31 },
  { name: "Gastão Cassel", image: "17_gastao_cassel.png", x: 31.5, y: 67.31 },
  { name: "Schirlei Alves", image: "18_schirlei_alves.png", x: 49.46, y: 67.31 },
  { name: "Marcelo Siqueira", image: "19_marcelo_siqueira.png", x: 68.46, y: 67.31 },
  { name: "Cláudia Weimann", image: "20_claudia_weimann.png", x: 86.38, y: 67.31 },
  { name: "Fábia Hafermann", image: "21_fabia_hafermann.png", x: 13.53, y: 79.99 },
  { name: "Fábio Bispo", image: "22_fabio_bispo.png", x: 31.5, y: 79.99 },
  { name: "Carlos Henrique Braga", image: "23_carlos_henrique_braga.png", x: 49.46, y: 79.99 },
  { name: "Mylene Margarida", image: "24_mylene_margarida.png", x: 68.46, y: 79.99 },
  { name: "Alexandre Gonçalves", image: "25_alexandre_goncalves.png", x: 86.38, y: 79.99 },
  { name: "Jairo Cardoso", image: "26_jairo_cardoso.png", x: 13.53, y: 92.78 },
  { name: "Bruno Cruz", image: "27_bruno_cruz.png", x: 31.5, y: 92.78 },
  { name: "Linete Martins", image: "28_linete_martins.png", x: 49.46, y: 92.78 },
  { name: "Roseméri Laurindo", image: "29_rosemeri_laurindo.png", x: 68.46, y: 92.78 },
  { name: "Valci Zuculoto", image: "30_valci_zuculoto.png", x: 86.38, y: 92.78 }
]

export default function KnowMePage() {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<(typeof members)[number] | null>(null)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedMember(null)
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [])

  return (
    <main className="min-h-screen bg-zinc-50 px-4 pb-12 dark:bg-neutral-900">
      <header className="mx-auto flex h-[150px] max-w-5xl items-start justify-between">
        <img
          src="/assets/logo.jpeg"
          alt="Logo"
          className="mt-4 h-[118px] w-auto object-contain"
        />

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-zinc-200 px-5 py-2 font-semibold text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
        >
          Voltar
        </button>
      </header>

      <section className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Conheça a chapa
        </h1>

        <p className="mb-5 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Clique na foto de cada integrante para ver mais informações.
        </p>

        <div className="relative mx-auto max-w-3xl">
          <img
            src="/assets/todos.jpeg"
            alt="Chapa 1 - Conexão, Valor e Movimento"
            className="w-full rounded-lg border border-zinc-200 bg-white object-contain shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          />

          {members.map(member => (
            <button
              key={member.image}
              type="button"
              aria-label={`Abrir detalhes de ${member.name}`}
              title={member.name}
              onClick={() => setSelectedMember(member)}
              className="absolute aspect-square w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent transition hover:border-blue-500 hover:bg-blue-500/10 focus:border-blue-600 focus:bg-blue-500/10 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
              style={{ left: `${member.x}%`, top: `${member.y}%` }}
            />
          ))}
        </div>
      </section>

      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${selectedMember.name}`}
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-[39.2rem] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-lg font-bold leading-none text-white transition hover:bg-black"
              aria-label="Fechar"
            >
              ×
            </button>

            <img
              src={`/assets/${selectedMember.image}`}
              alt={selectedMember.name}
              className="max-h-[92vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </main>
  )
}
