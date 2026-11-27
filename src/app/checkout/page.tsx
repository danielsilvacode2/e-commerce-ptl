import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import CheckoutPageClient from '@/src/components/checkout/checkout-page'
import ErrorBoundary from '@/src/components/ui/error-boundary'

export const metadata = {
  title: 'Checkout | NERO',
  description: 'Revise os itens do seu pedido e escolha o endereço de entrega antes do pagamento.',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans flex flex-col justify-between transition-colors">
      <div>
        <HeaderHome />
        <ErrorBoundary scope="section" sectionName="o checkout">
          <CheckoutPageClient />
        </ErrorBoundary>
      </div>
      <FooterHome />
    </div>
  )
}
