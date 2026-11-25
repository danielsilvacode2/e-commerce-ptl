import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Ajuda', href: '/ajuda' },
  { label: 'Privacidade (LGPD)', href: '/ajuda#privacidade' },
  { label: 'Termos e Condições', href: '/ajuda#termos' },
] as const

export default function FooterHome() {
  return (
    <footer className="bg-[#F2F0F1] dark:bg-[#151515] text-black dark:text-white mt-16 py-10 border-t border-black/10 dark:border-white/10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-black/10 dark:border-white/10">
          <div>
            <Link
              href="/"
              className="font-display font-extrabold text-2xl tracking-tight uppercase text-black dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded"
            >
              NERO
            </Link>
            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
              Moda casual e streetwear moderno.
            </p>
          </div>

          <nav aria-label="Links úteis" className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-sans">
          <p>NERO © 2026. Todos os direitos reservados.</p>
          <a
            href="https://github.com/danielsilvacode2"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
