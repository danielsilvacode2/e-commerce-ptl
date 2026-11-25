import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Headphones, Truck, FileText, Lock } from 'lucide-react'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'

export const metadata: Metadata = {
  title: 'Ajuda e LGPD | NERO',
  description:
    'Informações sobre atendimento ao cliente, envio, termos e condições e política de privacidade da NERO em conformidade com a LGPD.',
}

interface HelpTopic {
  id: string
  title: string
  summary: string
  lgpdNote: string
  icon: 'support' | 'shipping' | 'terms' | 'privacy'
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'atendimento',
    title: 'Atendimento ao Cliente',
    summary:
      'Nosso suporte está disponível na área "Minha Conta", por meio do Assistente NERO, para esclarecer dúvidas sobre pedidos, trocas e reembolsos.',
    lgpdNote:
      'Em conformidade com a LGPD (Lei nº 13.709/2018), os dados informados durante o atendimento são utilizados exclusivamente para identificar sua solicitação e resolver o chamado, garantindo sigilo e o exercício dos seus direitos de acesso, correção ou exclusão de dados.',
    icon: 'support',
  },
  {
    id: 'envio',
    title: 'Detalhes de Envio',
    summary:
      'Todos os pedidos confirmados seguem com frete grátis e acompanhamento de status em "Meus Pedidos", desde a preparação até a entrega.',
    lgpdNote:
      'Para viabilizar a entrega, tratamos apenas os dados estritamente necessários (nome, endereço e contato) com base na execução de contrato (art. 7º, V da LGPD), compartilhando-os somente com parceiros logísticos quando indispensável para o transporte.',
    icon: 'shipping',
  },
  {
    id: 'termos',
    title: 'Termos e Condições',
    summary:
      'Ao utilizar a NERO, o usuário concorda em fornecer informações verdadeiras no cadastro e respeitar as regras de pagamento, cancelamento e estorno conforme o status do pedido.',
    lgpdNote:
      'As operações da plataforma seguem o Código de Defesa do Consumidor e a LGPD, assegurando transparência nas compras, proteção contra uso indevido da conta e revisão de solicitações sempre que necessário.',
    icon: 'terms',
  },
  {
    id: 'privacidade',
    title: 'Política de Privacidade',
    summary:
      'Coletamos somente os dados essenciais para criar sua conta, processar pedidos e cumprir obrigações legais. Dados de cartão são tokenizados pelo intermediador de pagamentos e não são armazenados em texto aberto.',
    lgpdNote:
      'Nos termos do art. 18 da LGPD, você tem direito a confirmar a existência de tratamento, acessar, corrigir, anonimizar ou solicitar a eliminação dos seus dados pessoais, bem como revogar consentimentos quando aplicável.',
    icon: 'privacy',
  },
]

function TopicIcon({ icon }: { icon: HelpTopic['icon'] }) {
  switch (icon) {
    case 'support':
      return <Headphones className="h-5 w-5" aria-hidden="true" />
    case 'shipping':
      return <Truck className="h-5 w-5" aria-hidden="true" />
    case 'terms':
      return <FileText className="h-5 w-5" aria-hidden="true" />
    case 'privacy':
      return <Lock className="h-5 w-5" aria-hidden="true" />
  }
}

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors">
      <HeaderHome />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar à loja
          </Link>
        </div>

        <header className="pb-8 border-b border-black/10 dark:border-white/10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F0F1] dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 text-[11px] font-semibold uppercase tracking-widest text-black dark:text-white">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Ajuda &amp; LGPD
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            Central de Ajuda
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Resumo transparente das nossas práticas de atendimento, envio, termos de uso e proteção de dados pessoais conforme a LGPD (Lei nº 13.709/2018).
          </p>

          <nav aria-label="Tópicos de ajuda" className="mt-6 flex flex-wrap gap-2">
            {HELP_TOPICS.map((topic) => (
              <a
                key={topic.id}
                href={`#${topic.id}`}
                className="rounded-full border border-black/10 dark:border-white/15 bg-[#F2F0F1] dark:bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white transition-colors"
              >
                {topic.title}
              </a>
            ))}
          </nav>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6">
          {HELP_TOPICS.map((topic) => (
            <section
              key={topic.id}
              id={topic.id}
              aria-labelledby={`help-${topic.id}`}
              className="scroll-mt-28 rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1]/70 dark:bg-[#1a1a1a] p-6 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black">
                  <TopicIcon icon={topic.icon} />
                </div>
                <h2
                  id={`help-${topic.id}`}
                  className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-tight text-black dark:text-white"
                >
                  {topic.title}
                </h2>
              </div>

              <p className="mt-4 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {topic.summary}
              </p>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {topic.lgpdNote}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 dark:border-white/10 pt-8">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Dúvidas rápidas sobre uso da loja? Consulte nossa página de perguntas frequentes.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center justify-center rounded-full bg-black dark:bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white transition-colors"
          >
            Ver FAQ
          </Link>
        </div>
      </main>

      <FooterHome />
    </div>
  )
}
