'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
// ajuste o caminho conforme a sua estrutura de pastas
import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'

// Procura a lista de produtos em qualquer formato de resposta:
// [..]  |  { data: [..] }  |  { products: [..] }  |  { data: { items: [..] } } ...
function extractList(data: unknown): ProductResponse[] {
  if (Array.isArray(data)) return data as ProductResponse[]
  if (data && typeof data === 'object') {
    for (const value of Object.values(data as Record<string, unknown>)) {
      const found = extractList(value)
      if (found.length > 0) return found
    }
  }
  return []
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Produto é "Novo" se foi criado há até 3 dias
const NEW_DAYS = 3

const isNew = (iso: string) => {
  const t = new Date(iso).getTime()
  return !Number.isNaN(t) && Date.now() - t < 1000 * 60 * 60 * 24 * NEW_DAYS
}

// Grid compartilhado entre produtos e skeleton para manter o layout igual
const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  className: 'h-5 w-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function TruckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  )
}

function SwapIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 8h14l-3-3M20 16H6l3 3" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </svg>
  )
}

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-16 w-16 text-blue-900/40 sm:h-24 sm:w-24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  )
}

const BENEFITS = [
  { title: 'Frete grátis acima de R$ 199', sub: 'Para todo o Brasil.', Icon: TruckIcon },
  { title: 'Troca em até 30 dias', sub: 'Sem burocracia.', Icon: SwapIcon },
  { title: 'Pagamento seguro', sub: 'Pix, cartão ou boleto.', Icon: LockIcon },
]

export default function StorePage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    ProductReadAllService()
      .then((data) => {
        console.log('Resposta da API /products:', data)
        setProducts(extractList(data))
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Se houver usuário logado (token) vai para /account, senão vai para /login
  const handleAccountClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      router.push(user?.token ? '/account' : '/login')
    } catch {
      // JSON inválido no localStorage
      router.push('/login')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = Array.isArray(products) ? products : []
    return list.filter(
      (p) =>
        !q ||
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    )
  }, [products, search])

  // Até 3 produtos com imagem para compor o hero
  const heroProducts = useMemo(
    () => products.filter((p) => p.image).slice(0, 3),
    [products]
  )

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 md:flex-nowrap md:gap-8">
          <img
            className="w-[120px] sm:w-[160px] md:w-[200px]"
            src="/assests/logo-ocean-azul-escuro.png"
            alt="Ocean"
          />

          {/* Busca: linha própria no mobile, central no desktop */}
          <div className="relative order-last w-full md:order-none md:w-auto md:flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos"
              className="h-10 w-full rounded-md border border-slate-300 pl-10 pr-4 text-[15px] outline-none placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 md:h-11"
            />
          </div>

          <nav className="ml-auto flex items-center gap-4 text-base font-medium sm:gap-8 md:ml-0">
            <a href="#produtos" className="hidden hover:text-blue-800 sm:inline">Produtos</a>
            <a
              href="/account"
              onClick={handleAccountClick}
              className="hidden hover:text-blue-800 sm:inline"
            >
              Minha conta
            </a>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 hover:bg-slate-50 sm:px-4 md:h-11"
            >
              <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                      </svg>

              Carrinho
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-900 px-1 text-xs font-semibold text-white">
                {cartCount}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero: texto à esquerda, produtos em destaque à direita */}
      <section className="bg-gradient-to-br from-blue-950 to-blue-900  bg-[position:center_76%] text-white"
       style={{ backgroundImage: "url('/assests/bg-ocean-blue900.png')" }}
      >
        <div className="mx-auto grid max-w-[1120px] items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-10 md:py-20">
          <div>
            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl md:leading-[1.05]">
              Tudo para a sua loja, em um só lugar.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100 sm:mt-6 sm:text-[17px]">
              Escolha, compre e receba com acompanhamento em tempo real. Seus dados
              ficam protegidos e criptografados.
            </p>
            <a
              href="#produtos"
              className="mt-6 inline-block rounded-md bg-amber-400 px-5 py-3 text-[15px] font-semibold text-slate-900 transition-colors hover:bg-amber-300 sm:mt-8"
            >
              Ver produtos
            </a>
          </div>

          {heroProducts.length > 0 ? (
            <div className="grid h-[300px] grid-cols-2 grid-rows-2 gap-3 sm:h-[380px] sm:gap-4">
              {heroProducts.map((p, i) => (
                <a
                  key={p.id}
                  href="#produtos"
                  className={`group relative flex flex-col overflow-hidden rounded-xl bg-white p-3 text-slate-900 ${i === 0 ? 'row-span-2' : ''
                    }`}
                >
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                    <p className="text-sm font-bold text-blue-900">{brl(p.price)}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-xl bg-white/5 sm:h-[380px]">
              <PlaceholderIcon />
            </div>
          )}
        </div>
      </section>

      {/* Faixa de benefícios */}
      <section className="border-b border-slate-200 bg-white">
        <ul className="mx-auto grid max-w-[1120px] gap-4 px-4 py-5 sm:grid-cols-3 sm:gap-6 sm:px-6">
          {BENEFITS.map(({ title, sub, Icon }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-slate-600">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Produtos */}
      <section id="produtos" className="mx-auto max-w-[1120px] scroll-mt-32 px-4 py-10 sm:px-6 md:scroll-mt-20 md:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Produtos em destaque</h2>
        </div>

        {loading && (
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-44 rounded-md bg-slate-100 sm:h-56" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                <div className="mt-4 h-10 rounded bg-slate-100 sm:h-11" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Não foi possível carregar os produtos. {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-slate-600">Nenhum produto encontrado.</p>
        )}

        <div className={GRID}>
          {filtered.map((p) => (
            <article
              key={p.id}
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10 hover:ring-slate-300"
            >
              {/* Imagem */}
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:h-56">
                {isNew(p.created_at) && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                    Novo
                  </span>
                )}

                {p.quantity > 0 && p.quantity <= 5 && (
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    Últimas unidades
                  </span>
                )}

                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-110 ${p.quantity <= 0 ? 'opacity-50 grayscale' : ''
                      }`}
                  />
                ) : (
                  <PlaceholderIcon />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-900 sm:min-h-[3rem] sm:text-[15px] sm:leading-6">
                  {p.name}
                </h3>

                <p className=" line-clamp-1 min-h-[1rem] text-xs text-slate-500 sm:min-h-[1.25rem] sm:text-[13px]">
                  {p.description}
                </p>

                <p className="mb-4 mt-3 text-xl font-bold tracking-tight text-blue-950 sm:text-[19px]">
                  {brl(p.price)}
                </p>

                <button
                  type="button"
                  disabled={p.quantity <= 0}
                  onClick={() => setCartCount((n) => n + 1)}
                  className="mt-auto flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-950 px-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-400 hover:text-blue-950 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:hover:bg-slate-100 sm:h-11 sm:text-[15px]"
                >
                  {p.quantity <= 0 ? (
                    'Indisponível'
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                      </svg>
                      Adicionar ao carrinho
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}