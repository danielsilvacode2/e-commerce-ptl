'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'

interface HeroHomeProps {
    listProducts: ProductResponse[]
}

export default function HeroHome({ listProducts }: HeroHomeProps) {


    function PlaceholderIcon() {
        return (
            <svg viewBox="0 0 24 24" className="h-16 w-16 text-[#ff6a00] sm:h-24 sm:w-24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
                <path d="M3 7l9 4 9-4M12 11v10" />
            </svg>
        )
    }

    const heroProducts = useMemo(
        () => listProducts.filter((p) => p.image).slice(0, 3),
        [listProducts]
    )


    return (
        <section className="border-b border-[#333] bg-[#161616] font-inter text-[#eaeaea]">
            <div className="mx-auto grid max-w-[1120px] items-end gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-10 md:py-20">
                <div>
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-6xl font-extrabold uppercase leading-[0.88] tracking-tight sm:text-7xl md:text-7xl lg:text-7xl">
                        Tudo para a sua loja<span className="text-[#ff6a00]">,</span>
                        <br />
                        em um só <span className="text-[#ff6a00]">lugar.</span>
                    </h1>
                    <p className="mt-6   max-w-md text-sm leading-relaxed text-neutral-400 sm:mt-8 sm:text-[14px]">
                        Escolha, compre e receba com acompanhamento em tempo real. Seus dados
                        ficam protegidos e criptografados.
                    </p>
                    <a
                        href="#produtos"
                        className="mt-6 inline-block rounded-none bg-[#ff6a00] px-5 py-3 text-[13px] font-medium uppercase tracking-widest text-[#161616] transition-colors hover:bg-[#eaeaea] sm:mt-8"
                    >
                        Ver produtos
                    </a>
                </div>

                {heroProducts.length > 0 ? (
                    <div className="grid h-[300px] grid-cols-2 grid-rows-2 border-l border-t border-[#333] sm:h-[380px]">
                        {heroProducts.map((p, i) => (
                            <a
                                key={p.id}
                                href="#produtos"
                                className={`group relative flex flex-col overflow-hidden border-b border-r border-[#333] bg-[#161616] text-[#eaeaea] ${i === 0 ? 'row-span-2' : ''
                                    }`}
                            >
                                <div className="flex min-h-0 flex-1 items-center justify-center bg-[#e6e4dd] p-3">
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="border-t border-[#333] px-3 py-2">
                                    <p className="line-clamp-1 font-['Barlow_Condensed',Impact,sans-serif] text-base  uppercase tracking-wide">
                                        {p.name}
                                    </p>
                                    <p className="font-['Barlow_Condensed',Impact,sans-serif] text-lg  tracking-wide text-[#ff6a00]">
                                        R${p.price}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-[300px] items-center justify-center border border-[#333] sm:h-[380px]">
                        <PlaceholderIcon />
                    </div>
                )}
            </div>
        </section>
    )
}