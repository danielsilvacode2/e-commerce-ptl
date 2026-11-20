'use client'

import { useEffect, useState } from 'react'
import MainCart from '@/src/components/carrinho/main/main'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'

export default function CartPage() {
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [cartRefresh, setCartRefresh] = useState <number>(1)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError("")

        ReadCart()
            .then((res) => {
                if (!cancelled) setCart(res)
            })
            .catch(() => {
                if (!cancelled) setError("Erro ao carregar carrinho.")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-between">
            <div>
                <HeaderHome refreshKey={cartRefresh} />
                <MainCart
                    list={cart?.list}
                    setList={setCart}
                    loading={loading}
                    error={error}
                    setCartRefresh={setCartRefresh}
                />
            </div>
            <FooterHome />
        </div>
    )
}
