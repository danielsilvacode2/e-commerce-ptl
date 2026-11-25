import { Suspense } from 'react'
import type { Metadata } from 'next'
import HeaderHome from '@/src/components/home/header/header'
import OrderPaymentClient from '@/src/components/pedidos/pagamento/pagamento'
import ErrorBoundary from '@/src/components/ui/error-boundary'
import { PaymentPageSkeleton } from '@/src/components/ui/skeletons'

export const metadata: Metadata = {
  title: 'Pagamento do Pedido | NERO',
  description: 'Finalize o pagamento do seu pedido via Pix ou Cartão de Crédito com segurança.',
}

interface OrderPaymentPageProps {
  params: Promise<{
    id: string
  }>
}

async function OrderPaymentContent({ params }: OrderPaymentPageProps) {
  const { id } = await params
  return <OrderPaymentClient orderId={id} />
}

export default function OrderPaymentPage({ params }: OrderPaymentPageProps) {
  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#121212] text-black dark:text-white transition-colors">
      <HeaderHome />
      <ErrorBoundary scope="section" sectionName="o pagamento do pedido">
        <Suspense fallback={<PaymentPageSkeleton />}>
          <OrderPaymentContent params={params} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
