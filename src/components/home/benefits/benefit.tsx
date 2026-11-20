import { ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react'

export default function BenefitsHome() {
  const BENEFITS = [
    {
      title: 'Entrega Rápida e Segura',
      sub: 'Frete grátis para compras acima de R$ 199',
      icon: Truck,
    },
    {
      title: 'Satisfação Garantida',
      sub: '30 dias para devolução ou troca sem complicações',
      icon: RefreshCw,
    },
    {
      title: 'Pagamento Criptografado',
      sub: 'Pix, cartões em até 12x e boleto com segurança total',
      icon: ShieldCheck,
    },
    {
      title: 'Suporte 24/7',
      sub: 'Atendimento exclusivo via chat e WhatsApp',
      icon: Headphones,
    },
  ]

  return (
    <section className="bg-white dark:bg-[#121212] border-b border-black/10 dark:border-white/10 py-10 sm:py-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {BENEFITS.map(({ title, sub, icon: Icon }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-4 rounded-2xl bg-[#F2F0F1]/60 dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 transition-all"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wide text-black dark:text-white">
                  {title}
                </h4>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
