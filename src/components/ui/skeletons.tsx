interface SkeletonProps {
  className?: string
}

/**
 * Bloco base de skeleton com shimmer leve baseado apenas em transform (GPU)
 * e desativado automaticamente em prefers-reduced-motion.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`nero-shimmer rounded-md ${className}`} />
}

/**
 * Skeleton do card de produto — mesmas proporções do card real (zero CLS).
 */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      <Skeleton className="aspect-square w-full rounded-2xl border border-black/5 dark:border-white/5" />
      <div className="mt-4 flex flex-col flex-1">
        <Skeleton className="h-6 w-4/5 rounded-md" />
        <Skeleton className="mt-1.5 h-7 w-2/5 rounded-md" />
        <Skeleton className="mt-3 h-10 w-full rounded-full sm:hidden" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({
  count = 4,
  label = 'Carregando produtos...',
}: {
  count?: number
  label?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={`product-skeleton-${idx}`} />
      ))}
    </div>
  )
}

/**
 * Skeleton da vitrine em destaque do Hero.
 */
export function HeroFeaturedSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex h-full w-full flex-col justify-between"
    >
      <span className="sr-only">Carregando peça em destaque...</span>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="my-4 flex flex-1 items-center justify-center">
        <Skeleton className="h-56 w-56 sm:h-64 sm:w-64 rounded-2xl" />
      </div>
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#222222] p-4 flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-5 w-20 shrink-0" />
      </div>
    </div>
  )
}

/**
 * Skeleton do modal / página de detalhe do produto (mesmo grid de 2 colunas).
 */
export function ProductDetailSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
    >
      <span className="sr-only">Carregando detalhes do produto...</span>

      <Skeleton className="aspect-square w-full rounded-2xl" />

      <div className="flex flex-col h-full justify-between">
        <div>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-4/5" />

          <div className="mt-5 space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-9 w-36" />
          </div>

          <Skeleton className="mt-4 h-9 w-48 rounded-xl" />

          <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton de um item da lista do carrinho (mesmas dimensões do item real).
 */
export function CartItemSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full">
        <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
        <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 max-w-[240px]" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Skeleton do resumo do pedido no carrinho / checkout.
 */
export function OrderSummarySkeleton() {
  return (
    <div
      aria-hidden="true"
      className="lg:col-span-5 rounded-3xl border border-black/10 dark:border-white/10 p-6 sm:p-8 bg-white dark:bg-[#181818] space-y-6"
    >
      <Skeleton className="h-7 w-48" />

      <div className="space-y-4 divide-y divide-black/5 dark:divide-white/5">
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-28" />
        </div>
      </div>

      <Skeleton className="h-13 w-full rounded-full" />
    </div>
  )
}

/**
 * Skeleton completo da página do carrinho (lista + resumo do pedido).
 */
export function CartPageSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
    >
      <span className="sr-only">Carregando seu carrinho...</span>

      <div className="lg:col-span-7 rounded-3xl border border-black/10 dark:border-white/10 p-4 sm:p-6 bg-white dark:bg-[#181818] space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-3.5 w-32" />
        </div>

        <div className="divide-y divide-black/10 dark:divide-white/10">
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>
      </div>

      <OrderSummarySkeleton />
    </div>
  )
}

/**
 * Skeleton de card de pedido em Meus Pedidos.
 */
export function OrderCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-4 w-52" />
        <div className="flex items-center gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function OrdersListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Carregando seus pedidos...</span>
      {Array.from({ length: count }).map((_, idx) => (
        <OrderCardSkeleton key={`order-skeleton-${idx}`} />
      ))}
    </div>
  )
}

/**
 * Skeleton da página de detalhe do pedido.
 */
export function OrderDetailSkeleton() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
    >
      <span className="sr-only">Carregando detalhes do pedido...</span>

      <div className="border-b border-black/10 dark:border-white/10 pb-4 mb-8">
        <Skeleton className="h-4 w-44" />
      </div>

      <div className="rounded-3xl bg-[#F2F0F1] dark:bg-[#181818] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-black/10 dark:border-white/10 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`meta-sk-${i}`} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8 space-y-5">
        <Skeleton className="h-6 w-52" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`item-sk-${i}`} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </main>
  )
}

/**
 * Skeleton da página de pagamento do pedido.
 */
export function PaymentPageSkeleton() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
    >
      <span className="sr-only">Carregando pagamento do pedido...</span>

      <div className="border-b border-black/10 dark:border-white/10 pb-4 mb-8 flex justify-between">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="mb-8 space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-9 w-72" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>

        <OrderSummarySkeleton />
      </div>
    </main>
  )
}

/**
 * Skeleton compacto para sugestões de busca no header.
 */
export function SearchSuggestionsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="p-2 space-y-1.5">
      <span className="sr-only">Buscando produtos...</span>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={`search-sk-${idx}`} className="flex items-center justify-between gap-3 px-2 py-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3.5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}
