import Link from 'next/link'

function TwitterIcon() {
  return (
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function FooterHome() {
  return (
    <footer className="bg-[#F2F0F1] dark:bg-[#151515] text-black dark:text-white mt-20 pt-16 pb-12 border-t border-black/10 dark:border-white/10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-12 pb-12 border-b border-black/10 dark:border-white/10">
          
          {/* Logo & Sobre */}
          <div className="col-span-2">
            <Link
              href="/"
              className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight uppercase text-black dark:text-white"
            >
                NERO
            </Link>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 font-sans max-w-sm leading-relaxed">
              Temos roupas que combinam com o seu estilo e das quais você se orgulha de usar. Da moda casual ao streetwear de alto nível.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://github.com/danielsilvacode2"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black dark:text-white">
              EMPRESA
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Trabalhe Conosco</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Sustentabilidade</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black dark:text-white">
              AJUDA
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Atendimento ao Cliente</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Detalhes de Envio</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Termos e Condições</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-black dark:text-white">
              FAQ
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Conta</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Gerenciar Entregas</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Pedidos</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white transition-colors">Pagamentos</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-sans">
          <p>SHOP.CO © 2026. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 font-bold text-[10px] text-black dark:text-white">VISA</span>
            <span className="px-2.5 py-1 rounded bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 font-bold text-[10px] text-black dark:text-white">MASTERCARD</span>
            <span className="px-2.5 py-1 rounded bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 font-bold text-[10px] text-black dark:text-white">PIX</span>
            <span className="px-2.5 py-1 rounded bg-white dark:bg-[#202020] border border-black/10 dark:border-white/10 font-bold text-[10px] text-black dark:text-white">APPLE PAY</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
