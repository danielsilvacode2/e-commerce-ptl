'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavProducts from '@/src/components/products/nav/nav'
import MainProducts from '@/src/components/products/main'
import { useSession } from '@/src/components/providers/session-provider'
import { Skeleton } from '@/src/components/ui/skeletons'

export default function ProductsPage() {
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
        <NavProducts active="list" />
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-5xl space-y-4">
            <Skeleton className="h-10 w-64 rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#121212] font-sans text-black dark:text-white transition-colors">
      <NavProducts active="list" />
      <MainProducts />
    </div>
  )
}
