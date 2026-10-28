

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



export default function BenefitsHome() {
    const BENEFITS = [
        { title: 'Frete grátis acima de R$ 199', sub: 'Para todo o Brasil.', Icon: TruckIcon },
        { title: 'Troca em até 30 dias', sub: 'Sem burocracia.', Icon: SwapIcon },
        { title: 'Pagamento seguro', sub: 'Pix, cartão ou boleto.', Icon: LockIcon },
    ]


    return (
        <section className="border-b border-[#333] bg-[#161616] font-inter text-[#eaeaea]">
            <ul className="mx-auto grid max-w-[1120px] sm:grid-cols-3">
                {BENEFITS.map(({ title, sub, Icon }) => (
                    <li
                        key={title}
                        className="flex items-center gap-3 border-b border-[#333] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-[#333] text-[#ff6a00]">
                            <Icon />
                        </span>
                        <div>
                            <p className="text-[12px] font-medium uppercase tracking-widest text-[#eaeaea]">{title}</p>
                            <p className="mt-0.5 text-[12px] uppercase tracking-wider text-neutral-500">{sub}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}