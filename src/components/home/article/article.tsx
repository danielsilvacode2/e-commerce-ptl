'use client'

import { JSX, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'
import { Dispatch, SetStateAction } from "react";

const ICON_PROPS = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}


// Grade colada: borda no topo/esquerda aqui, direita/baixo em cada célula
const GRID = 'grid grid-cols-2 border-l border-t border-[#333] md:grid-cols-3 lg:grid-cols-4'

const isNew = (iso: string) => {
    const t = new Date(iso).getTime()
    return !Number.isNaN(t) && Date.now() - t < 1000 * 60 * 60 * 24 * 3
}


interface ArticleHomeProps {
    listProducts: ProductResponse[]
    setCartCount: Dispatch<SetStateAction<number>>
    PlaceholderIcon: () => JSX.Element
    loading: boolean
    error: string | null
}


export default function ArticleHome({ listProducts, setCartCount, PlaceholderIcon, loading, error }: ArticleHomeProps) {



    return (
        <section id="produtos" className="mx-auto max-w-[1120px] scroll-mt-32 px-4 py-10 font-inter text-[#eaeaea] sm:px-6 md:scroll-mt-20 md:py-14">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
                <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                    Produtos em destaque
                </h2>
            </div>

            {loading && (
                <div className={GRID}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse border-b border-r border-[#333]">
                            <div className="h-44 bg-[#242424] sm:h-56" />
                            <div className="p-4">
                                <div className="h-4 w-2/3 bg-[#242424]" />
                                <div className="mt-2 h-3 w-1/2 bg-[#242424]" />
                            </div>
                            <div className="h-11 border-t border-[#333] bg-[#1d1d1d]" />
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="border border-[#ff6a00] bg-[#ff6a00]/10 px-4 py-3 text-[13px] uppercase tracking-wider text-[#ff6a00]">
                    Não foi possível carregar os produtos.
                </p>
            )}

            {!loading && !error && listProducts.length === 0 && (
                <p className="text-sm uppercase tracking-wider text-neutral-400">Nenhum produto encontrado.</p>
            )}

            <div className={GRID}>
                {listProducts.map((p, i) => (
                    <article
                        key={p.id}
                        className="group relative flex min-w-0 flex-col border-b border-r border-[#333] bg-[#161616]"
                    >
                        {/* Imagem */}
                        <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-[#333] bg-[#e6e4dd] p-4 text-[#161616] sm:h-56">
                            {isNew(p.created_at) && (
                                <span className="absolute left-0 top-0 z-10 bg-[#ff6a00] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[#161616]">
                                    Novo
                                </span>
                            )}

                            {p.quantity > 0 && p.quantity <= 5 && (
                                <span className="absolute right-0 top-0 z-10 border-b border-l border-[#ff6a00] bg-[#161616] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#ff6a00]">
                                    Últimas unidades
                                </span>
                            )}

                            {p.image ? (
                                <img
                                    src={p.image}
                                    alt={p.name}
                                    loading="lazy"
                                    className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105 ${p.quantity <= 0 ? 'opacity-50 grayscale' : ''
                                        }`}
                                />
                            ) : (
                                <PlaceholderIcon />
                            )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex flex-1 flex-col p-3 sm:p-4">
                            <span className="text-[11px] uppercase tracking-widest text-neutral-500">
                                Ref. {String(i + 1).padStart(2, '0')}
                            </span>

                            <div className='flex flex-col '>
                                <h3 className=",t-1  min-h-[2.5rem] font-['Barlow_Condensed',Impact,sans-serif] text-[10px]  uppercase leading-5 tracking-wide text-[#eaeaea] sm:min-h-[3rem] sm:text-[17px] sm:leading-6">
                                    {p.name}
                                </h3>

                                <p className="line-clamp-1  mt-[-24px] min-h-[1rem] text-xs text-neutral-400 sm:min-h-[1.25rem]">
                                    {p.description}
                                </p>    
                            </div>


                            <p className="mt-3 font-['Barlow_Condensed',Impact,sans-serif] text-2xl  tracking-wide text-[#ff6a00] sm:text-3xl">
                                R$ {p.price}
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={p.quantity <= 0}
                            onClick={() => setCartCount((n) => n + 1)}
                            className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-none border-t border-[#333] px-3 text-left text-[12px] font-medium uppercase tracking-widest text-[#eaeaea] transition-colors duration-200 hover:bg-[#ff6a00] hover:text-[#161616] active:brightness-90 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent disabled:hover:text-neutral-600 sm:px-4"
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
                                    + Adicionar ao carrinho
                                </>
                            )}
                        </button>
                    </article>
                ))}
            </div>
        </section>
    )
}