import type { Metadata } from 'next'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import ErrorState from '@/src/components/ui/error-state'

export const metadata: Metadata = {
  title: 'Página não encontrada | NERO',
  description: 'A página que você procura não foi encontrada na loja NERO.',
}

// Página exibida automaticamente pelo Next.js quando uma rota não existe
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors">
      <HeaderHome />

      <main className="flex-1 mx-auto flex w-full max-w-2xl items-center justify-center px-4 sm:px-6 lg:px-8 py-14 sm:py-24">
        <ErrorState
          variant="not-found"
          secondaryHref="/"
          secondaryLabel="Voltar para a loja"
        />
      </main>

      <FooterHome />
    </div>
  )
}
