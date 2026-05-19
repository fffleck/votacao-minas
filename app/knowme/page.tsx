"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const members = [
  { name: "Lina Rocha", image: "lina.jpeg", x: 18.5, y: 25.5 },
  { name: "Pablo Friche", image: "pablo.jpeg", x: 40.5, y: 25.5 },
  { name: "Alessandra Costa", image: "alessandra.jpeg", x: 62.5, y: 25.5 },
  { name: "Rafael Motta", image: "rafael.jpeg", x: 84, y: 25.5 },
  { name: "Marcia Bueno", image: "marcia.jpeg", x: 18.5, y: 41.2 },
  { name: "Breno Araújo", image: "breno.jpeg", x: 40.5, y: 41.2 },
  { name: "Debora Lopes", image: "debora.jpeg", x: 62.5, y: 41.2 },
  { name: "Bruno Mateus", image: "bruno_mateus.jpeg", x: 84, y: 41.2 },
  { name: "Sandra Mara", image: "sandra.jpeg", x: 18.5, y: 57 },
  { name: "Bruno Daniel", image: "bruno_daniel.jpeg", x: 40.5, y: 57 },
  { name: "Jayme Costa", image: "jayme.jpeg", x: 62.5, y: 57 },
  { name: "Esley Amorim", image: "esley.jpeg", x: 84, y: 57 },
  { name: "Vanessa Santos", image: "vanessa.jpeg", x: 18.5, y: 72.8 },
  { name: "Ivan Fernandes", image: "ivan.jpeg", x: 40.5, y: 72.8 },
  { name: "Eduardo Elias", image: "eduardo.jpeg", x: 62.5, y: 72.8 },
  { name: "Larissa Vilela", image: "larissa.jpeg", x: 84, y: 72.8 },
  { name: "Matheus Queiroz", image: "matheus.jpeg", x: 18.5, y: 88.4 },
  { name: "Thiago Silva", image: "thiago.jpeg", x: 40.5, y: 88.4 },
  { name: "Andrea Santos", image: "andrea.jpeg", x: 62.5, y: 88.4 },
  { name: "Rogerio Afonso", image: "rogerio.jpeg", x: 84, y: 88.4 }
]

export default function KnowMePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"proposta" | "chapa">("chapa")
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

        <div className="mx-auto mb-8 flex max-w-3xl rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("chapa")}
            className={`flex-1 rounded-md px-4 py-3 text-sm font-semibold transition ${
              activeTab === "chapa"
                ? "bg-blue-600 text-white shadow"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Integrantes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("proposta")}
            className={`flex-1 rounded-md px-4 py-3 text-sm font-semibold transition ${
              activeTab === "proposta"
                ? "bg-blue-600 text-white shadow"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Nossa Proposta
          </button>
        </div>

        {activeTab === "chapa" && (
          <>
            <p className="mb-5 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Clique na foto de cada integrante para ver mais informações.
            </p>

            <div className="relative mx-auto max-w-3xl">
              <img
                src="/assets/todos.jpeg"
                alt="Chapa Resistência Jornalista"
                className="w-full rounded-lg border border-zinc-200 bg-white object-contain shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
              />

              {members.map(member => (
                <button
                  key={member.image}
                  type="button"
                  aria-label={`Abrir detalhes de ${member.name}`}
                  title={member.name}
                  onClick={() => setSelectedMember(member)}
                  className="absolute aspect-square w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent transition hover:border-blue-500 hover:bg-blue-500/10 focus:border-blue-600 focus:bg-blue-500/10 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                  style={{ left: `${member.x}%`, top: `${member.y}%` }}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === "proposta" && (
        <div className="mx-auto max-w-3xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6 text-base leading-relaxed text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Nossa Proposta
          </h2>

          <p>
            A chapa “Resistência, jornalista” se apresenta para dar continuidade à atual gestão do Sindicato dos Jornalistas Profissionais de Minas Gerais, reafirmando o compromisso histórico com a defesa da categoria, da profissão e da liberdade de imprensa. Em um cenário marcado pelo avanço da desinformação, pelas ameaças ao Estado Democrático de Direito, pela precarização das relações de trabalho e pelos ataques constantes aos direitos trabalhistas, entendemos que nunca foi tão necessário fortalecer a organização coletiva das e dos jornalistas.
          </p>
          <p>
            Nos últimos anos, atuamos para manter o Sindicato vivo política e financeiramente, garantindo sua capacidade de intervenção diante dos desafios enfrentados pela categoria. Agora, com um novo estatuto da entidade e uma chapa renovada pela chegada de novas militâncias e experiências profissionais, queremos seguir na linha de frente da luta em defesa do jornalismo e das condições dignas de trabalho.
          </p>
          <p>
            Defendemos um sindicato ativo, presente e articulado com os movimentos sociais, populares e sindicais, capaz de enfrentar os impactos das novas tecnologias, da plataformização e dos modelos cada vez mais precários de contratação. Também seguimos comprometidos com o combate às fake news, à violência contra jornalistas e ao assédio jurídico utilizado como instrumento de intimidação contra profissionais da imprensa.
          </p>
          <p>
            Entre nossas prioridades está a defesa da PEC do Diploma, entendida como uma medida fundamental para a valorização da profissão e da formação jornalística. Também manteremos a mobilização em defesa da comunicação pública em Minas Gerais, denunciando ataques e desmontes que atingem veículos fundamentais, como a Rádio Inconfidência e a TV Minas.
          </p>
          <p>
            No campo trabalhista, seguiremos atuando nas negociações coletivas, nas campanhas salariais e na defesa dos direitos da categoria diante das empresas de comunicação e demais empregadores. Queremos ampliar a orientação sindical, fortalecer mobilizações e aprofundar o debate sobre pejotização, MEIs e outras formas precárias de contratação que fragilizam vínculos empregatícios e retiram direitos históricos das e dos jornalistas.
          </p>
          <p>
            Nossa atuação também passa pelo enfrentamento ao assédio moral e sexual nos ambientes de trabalho, assim como pelo combate ao racismo, à lgbtfobia e a todas as formas de discriminação presentes nas redações, assessorias, agências e demais espaços profissionais. Defendemos um jornalismo comprometido com a diversidade, com a democracia e com os direitos humanos.
          </p>
          <p>
            A formação política e profissional seguirá como eixo estratégico da nossa atuação. Pretendemos promover cursos de qualificação, retomar o Congresso Estadual dos Jornalistas e o ENJAC, além de reconstruir iniciativas importantes para a categoria, como o Prêmio Délio Rocha. Também queremos fortalecer debates sobre precarização do trabalho, contrarreformas, antirracismo, feminismo classista, democratização da comunicação e direitos sociais.
          </p>
          <p>
            Outro compromisso central da chapa é fortalecer o Sindicato enquanto espaço de convivência, organização e mobilização da categoria. Queremos ampliar o número de sindicalizações, revitalizar a Casa dos Jornalistas, movimentar o espaço físico da entidade com cursos, debates e atividades culturais, além de estreitar o diálogo com universidades e cursos de Jornalismo.
          </p>
          <p>
            Também entendemos que é fundamental aproximar ainda mais o Sindicato das jornalistas e dos jornalistas do interior de Minas Gerais, ampliando visitas, debates e ações regionais, para que a entidade esteja conectada às diferentes realidades da profissão em todo o estado.
          </p>
          <p>
            A chapa “Resistência, jornalista” acredita na força da organização coletiva e na importância de um sindicato combativo, democrático e presente na vida da categoria. Seguiremos resistindo aos ataques à profissão, defendendo direitos, valorizando o jornalismo e fortalecendo a luta por uma sociedade mais democrática, justa e comprometida com a informação de qualidade.
          </p>
        </div>
        )}
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
