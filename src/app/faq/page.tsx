import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown, ArrowLeft, HelpCircle } from 'lucide-react'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'

export const metadata: Metadata = {
  title: 'FAQ — Perguntas Frequentes | NERO',
  description:
    'Tire suas dúvidas sobre conta, entregas, pedidos e pagamentos na loja NERO.',
}

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface FaqSection {
  id: string
  title: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'conta',
    title: 'Conta',
    items: [
      {
        id: 'criar-conta',
        question: 'Como crio uma conta na NERO?',
        answer:
          'Clique em "Criar Conta" no topo da página, preencha seus dados básicos e finalize o cadastro. Depois de confirmar seu e-mail, você já pode comprar e acompanhar seus pedidos.',
      },
      {
        id: 'esqueci-senha',
        question: 'Esqueci minha senha. Como recupero o acesso?',
        answer:
          'Na tela de login, selecione a opção "Esqueceu a senha?" e informe o e-mail cadastrado. Enviaremos um link para você definir uma nova senha com segurança.',
      },
      {
        id: 'carrinho-visitante',
        question: 'Posso montar meu carrinho antes de fazer login?',
        answer:
          'Sim. Você pode adicionar produtos ao carrinho como visitante e, assim que entrar na sua conta, os itens são sincronizados automaticamente para concluir a compra.',
      },
    ],
  },
  {
    id: 'entregas',
    title: 'Gerenciar Entregas',
    items: [
      {
        id: 'acompanhar-entrega',
        question: 'Como acompanho a entrega do meu pedido?',
        answer:
          'Acesse "Meus Pedidos" no menu superior. Lá você acompanha cada etapa em tempo real: Em Preparação, Enviado e Entregue.',
      },
      {
        id: 'frete',
        question: 'Qual é o valor do frete?',
        answer:
          'A NERO oferece frete grátis em todas as compras, com envio rápido e seguro para o endereço informado na finalização do pedido.',
      },
      {
        id: 'cancelar-transito',
        question: 'Posso cancelar ou pedir estorno com o pedido em trânsito?',
        answer:
          'Enquanto o pedido estiver com status "Enviado", o estorno fica bloqueado. Assim que ele for marcado como "Entregue", você poderá solicitar a análise de estorno na página do pedido.',
      },
    ],
  },
  {
    id: 'pedidos',
    title: 'Pedidos',
    items: [
      {
        id: 'status-pedidos',
        question: 'Onde consulto todos os meus pedidos?',
        answer:
          'Com a sua conta conectada, clique em "Meus Pedidos" no cabeçalho para ver o histórico completo, detalhes dos itens e o status atualizado de cada compra.',
      },
      {
        id: 'cancelamento-estorno',
        question: 'Como funciona o cancelamento ou estorno?',
        answer:
          'Pedidos em "Aguardando Pagamento" podem ser cancelados diretamente. Pedidos "Em Preparação" permitem estorno automático, e pedidos já "Entregues" podem ter o estorno solicitado para análise da nossa equipe.',
      },
      {
        id: 'ajuda-pedido',
        question: 'Preciso de ajuda com um pedido. Onde falo com o suporte?',
        answer:
          'Na página "Minha Conta", você encontra o Assistente NERO para tirar dúvidas rápidas sobre status de pedidos e reembolsos.',
      },
    ],
  },
  {
    id: 'pagamentos',
    title: 'Pagamentos',
    items: [
      {
        id: 'formas-pagamento',
        question: 'Quais formas de pagamento são aceitas?',
        answer:
          'Aceitamos Pix (com confirmação rápida) e cartão de crédito, com processamento criptografado na tela de pagamento do pedido.',
      },
      {
        id: 'seguranca-pagamento',
        question: 'Meus dados de pagamento ficam seguros?',
        answer:
          'Sim. Os dados do cartão são tokenizados diretamente pelo provedor de pagamentos e nunca ficam salvos em texto aberto nos nossos servidores.',
      },
      {
        id: 'confirmacao-pagamento',
        question: 'Quando meu pedido entra em preparação?',
        answer:
          'Assim que o pagamento é confirmado, o status do pedido muda automaticamente de "Aguardando Pagamento" para "Em Preparação".',
      },
    ],
  },
]

export default function FaqPage() {
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
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            FAQ
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            Perguntas Frequentes
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Respostas diretas sobre como funciona sua conta, entregas, pedidos e pagamentos na NERO.
          </p>

          <nav aria-label="Categorias do FAQ" className="mt-6 flex flex-wrap gap-2">
            {FAQ_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-black/10 dark:border-white/15 bg-[#F2F0F1] dark:bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white transition-colors"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </header>

        <div className="mt-10 space-y-12">
          {FAQ_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`heading-${section.id}`}
              className="scroll-mt-28"
            >
              <h2
                id={`heading-${section.id}`}
                className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-tight text-black dark:text-white mb-4"
              >
                {section.title}
              </h2>

              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.id}
                    className="group rounded-2xl border border-black/10 dark:border-white/10 bg-[#F2F0F1]/70 dark:bg-[#1a1a1a] px-5 py-4 transition-colors"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm sm:text-base font-semibold text-black dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#1a1a1a] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-tight text-black dark:text-white">
              Ainda precisa de ajuda?
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Consulte nossas informações de suporte e privacidade (LGPD) ou fale com o Assistente NERO.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ajuda"
              className="inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white transition-colors"
            >
              Central de Ajuda
            </Link>
            <Link
              href="/conta"
              className="inline-flex items-center justify-center rounded-full bg-black dark:bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white transition-colors"
            >
              Minha Conta
            </Link>
          </div>
        </div>
      </main>

      <FooterHome />
    </div>
  )
}
