'use client'

import { useMemo } from 'react'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import { Sparkles, ArrowRight } from 'lucide-react'

interface HeroHomeProps {
  listProducts: ProductResponse[]
}

export default function HeroHome({ listProducts }: HeroHomeProps) {
  const heroProducts = useMemo(
    () => listProducts.filter((p) => p.image).slice(0, 2),
    [listProducts]
  )

  return (
    <>
      <section className="bg-[#F2F0F1] dark:bg-[#181818] overflow-hidden transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Coluna de Texto & Estatísticas */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold uppercase tracking-wider text-black dark:text-white mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Coleção Urbana 2026
              </span>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.95] text-black dark:text-white">
                ENCONTRE ROUPAS QUE COMBINAM COM SEU ESTILO
              </h1>

              <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl font-sans leading-relaxed">
                Navegue pela nossa gama diversificada de peças meticulosamente trabalhadas, projetadas para realçar sua individualidade e atender ao seu senso de estilo único.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <a
                  href="#produtos"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black dark:bg-white px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-[1.02] active:scale-100 shadow-sm"
                >
                  Compre Agora <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Prova Social / Métricas */}
              <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-black/10 dark:border-white/10 w-full max-w-lg">
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black dark:text-white">
                    200+
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                    Marcas Globais
                  </p>
                </div>
                <div className="border-x border-black/10 dark:border-white/10 px-4 sm:px-6 text-center">
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black dark:text-white">
                    2.000+
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                    Produtos Alta Qualidade
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black dark:text-white">
                    30.000+
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                    Clientes Satisfeitos
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna Visual Hero */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-md aspect-4/5 sm:aspect-square lg:aspect-4/5 rounded-3xl bg-white border border-black/10 dark:border-white/20 p-6 shadow-xl flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-radial from-neutral-100 to-transparent opacity-60 pointer-events-none" />

                {heroProducts.length > 0 && heroProducts[0]?.image ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-between z-10">
                    <div className="relative w-full flex-1 flex items-center justify-center">
                      <img
                        src={heroProducts[0].image}
                        alt={heroProducts[0].name}
                        className="max-h-[320px] w-auto object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="w-full bg-[#F2F0F1] rounded-2xl p-4 flex items-center justify-between mt-4 border border-black/5">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          Item em Destaque
                        </span>
                        <h4 className="font-display font-bold text-sm text-black truncate uppercase">
                          {heroProducts[0].name}
                        </h4>
                      </div>
                      <span className="font-display font-extrabold text-base text-black shrink-0">
                        R$ {heroProducts[0].price}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Sparkles className="w-12 h-12 text-black/30 mx-auto mb-3" />
                    <p className="font-display font-bold text-lg uppercase tracking-tight text-black">
                      NOVA COLEÇÃO
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">Estilo minimalista de alto contraste</p>
                  </div>
                )}

                {/* Decorative streetwear badge */}
                <div className="absolute top-4 right-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full z-20">
                  Streetwear
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Faixa de Marcas Parceiras */}
      <div className="bg-black dark:bg-[#000000] py-8 sm:py-10 text-white overflow-hidden border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-8 sm:gap-12 opacity-80">
            <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight uppercase hover:opacity-100 transition-opacity cursor-default">
              VERSACE
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight uppercase hover:opacity-100 transition-opacity cursor-default">
              ZARA
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight uppercase hover:opacity-100 transition-opacity cursor-default">
              GUCCI
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight uppercase hover:opacity-100 transition-opacity cursor-default">
              PRADA
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight uppercase hover:opacity-100 transition-opacity cursor-default">
              CALVIN KLEIN
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
