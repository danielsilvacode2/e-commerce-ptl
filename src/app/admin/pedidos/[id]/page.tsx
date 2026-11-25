'use client'

import { Suspense, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavProducts from '@/src/components/products/nav/nav'
import AdminOrderDetailClient from '@/src/components/admin/pedidos/detalhe/detalhe'
import { useSession } from '@/src/components/providers/session-provider'
import ErrorBoundary from '@/src/components/ui/error-boundary'
import { OrderDetailSkeleton } from '@/src/components/ui/skeletons'

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function AdminOrderDetailContent({ params }: AdminOrderDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, authLoaded } = useSession()
  const authorized = authLoaded && user?.role === 'admin'

  useEffect(() => {
    if (authLoaded && user?.role !== 'admin') {
      router.replace('/')
    }
  }, [authLoaded, user, router])

  if (!authorized) {
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#121212] font-sans text-black dark:text-white transition-colors">
        <NavProducts active="orders" />
        <div className="flex-1">
          <OrderDetailSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#121212] font-sans text-black dark:text-white transition-colors">
      <NavProducts active="orders" />
      <ErrorBoundary scope="section" sectionName="os detalhes administrativos do pedido">
        <AdminOrderDetailClient orderId={id} />
      </ErrorBoundary>
    </div>
  )
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <AdminOrderDetailContent params={params} />
    </Suspense>
  )
}
