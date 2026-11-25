import { Suspense } from 'react'
import HeaderHome from '@/src/components/home/header/header'
import OrderDetailClient from '@/src/components/pedidos/detalhe/detalhe'
import ErrorBoundary from '@/src/components/ui/error-boundary'
import { OrderDetailSkeleton } from '@/src/components/ui/skeletons'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

async function OrderDetailContent({ params }: OrderDetailPageProps) {
  const { id } = await params
  return <OrderDetailClient orderId={id} />
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#121212] text-black dark:text-white transition-colors">
      <HeaderHome />
      <ErrorBoundary scope="section" sectionName="os detalhes do pedido">
        <Suspense fallback={<OrderDetailSkeleton />}>
          <OrderDetailContent params={params} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
