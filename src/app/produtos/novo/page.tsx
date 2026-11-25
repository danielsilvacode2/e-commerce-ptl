'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavProducts from '@/src/components/products/nav/nav'
import MainNovoProducts from '@/src/components/products/novo/main/main'
import { useSession } from '@/src/components/providers/session-provider'
import { Skeleton } from '@/src/components/ui/skeletons'

export default function NewProductPage() {
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
        <NavProducts active="new" />
        <main className="flex-1 px-6 py-10 flex justify-center">
          <div className="w-full max-w-[500px] space-y-4">
            <Skeleton className="h-10 w-72 rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#121212] font-sans text-black dark:text-white transition-colors">
      <NavProducts active="new" />
      <MainNovoProducts />
    </div>
  )
}
