'use client'

import { useEffect, useState } from 'react'
import MainCart from '@/src/components/carrinho/main/main'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import ReadMe from '@/src/actions/me/readMe'
import { guestCartService, GUEST_CART_STORAGE_KEY, GUEST_CART_EVENT } from '@/src/services/guest-cart'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'

export default function CartPage() {
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [cartRefresh, setCartRefresh] = useState<number>(1)
    const [isGuest, setIsGuest] = useState<boolean>(false)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError("")

        async function loadCartData() {
            try {
                const user = await ReadMe()
                if (cancelled) return

                if (user) {
                    setIsGuest(false)
                    const res = await ReadCart()
                    if (!cancelled) setCart(res)
                } else {
                    setIsGuest(true)
                    const guest = guestCartService.toCartResponse()
                    if (!cancelled) setCart(guest)
                }
            } catch {
                if (!cancelled) {
                    setIsGuest(true)
                    const guest = guestCartService.toCartResponse()
                    setCart(guest)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadCartData()

        function handleGuestUpdate() {
            if (isGuest) {
                setCart(guestCartService.toCartResponse())
            }
        }

        function handleStorage(e: StorageEvent) {
            if (e.key === GUEST_CART_STORAGE_KEY && isGuest) {
                setCart(guestCartService.toCartResponse())
            }
        }

        window.addEventListener(GUEST_CART_EVENT, handleGuestUpdate)
        window.addEventListener("storage", handleStorage)

        return () => {
            cancelled = true
            window.removeEventListener(GUEST_CART_EVENT, handleGuestUpdate)
            window.removeEventListener("storage", handleStorage)
        }
    }, [cartRefresh, isGuest])

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
                    isGuest={isGuest}
                />
            </div>
            <FooterHome />
        </div>
    )
}
