'use client'

import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReadMe, { UserResponse } from '@/src/actions/me/readMe'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import {
  guestCartService,
  GUEST_CART_EVENT,
  GUEST_CART_STORAGE_KEY,
} from '@/src/services/guest-cart'
import { CART_OPTIMISTIC_EVENT, CartOptimisticDetail } from '@/src/lib/cart-events'
import { clientCache } from '@/src/lib/client-cache'
import { ApiError, classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'

const CART_CACHE_KEY = 'cart:me'
const CART_CACHE_TTL_MS = 5 * 60 * 1000

function countCartItems(cart: CartResponse | null): number {
  return cart?.list?.reduce((acc, item) => acc + (item.quantity || 1), 0) ?? 0
}

export interface SessionContextValue {
  user: UserResponse | null
  authLoaded: boolean
  isAuthenticated: boolean
  cart: CartResponse | null
  setCart: Dispatch<SetStateAction<CartResponse | null>>
  cartLoaded: boolean
  cartErrorVariant: ErrorStateVariant | null
  cartIsStale: boolean
  cartCachedAt: number | null
  totalCartItems: number
  badgePulseKey: number
  refreshSession: () => Promise<UserResponse | null>
  refreshCart: (options?: { silent?: boolean }) => Promise<void>
  clearSession: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [cart, setCartState] = useState<CartResponse | null>(null)
  const [cartLoaded, setCartLoaded] = useState(false)
  const [cartErrorVariant, setCartErrorVariant] = useState<ErrorStateVariant | null>(null)
  const [cartIsStale, setCartIsStale] = useState(false)
  const [cartCachedAt, setCartCachedAt] = useState<number | null>(null)
  const [optimisticTotal, setOptimisticTotal] = useState<number | null>(null)
  const [badgePulseKey, setBadgePulseKey] = useState(0)

  const userRef = useRef<UserResponse | null>(null)
  const cartIsStaleRef = useRef<boolean>(false)
  const authInFlightRef = useRef<Promise<UserResponse | null> | null>(null)
  const cartInFlightRef = useRef<Promise<void> | null>(null)
  const cartInFlightVersionRef = useRef<number>(-1)
  // Controla versão de mutações locais para impedir que um GET /cart antigo sobrescreva remoções/edições recentes
  const cartMutationVersionRef = useRef<number>(0)

  const setCart: Dispatch<SetStateAction<CartResponse | null>> = useCallback((updater) => {
    cartMutationVersionRef.current += 1
    setOptimisticTotal(null)
    setCartState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next && userRef.current) {
        clientCache.set(CART_CACHE_KEY, next)
      }
      return next
    })
  }, [])

  const loadCartForUser = useCallback(
    async (activeUser: UserResponse | null, options?: { silent?: boolean }) => {
      if (!activeUser) {
        const guest = guestCartService.toCartResponse()
        setCartState(guest)
        setOptimisticTotal(null)
        setCartErrorVariant(null)
        setCartIsStale(false)
        setCartCachedAt(null)
        setCartLoaded(true)
        return
      }

      const requestVersion = cartMutationVersionRef.current

      if (cartInFlightRef.current && cartInFlightVersionRef.current === requestVersion) {
        return cartInFlightRef.current
      }

      cartInFlightVersionRef.current = requestVersion

      // Stale-While-Revalidate: exibe carrinho em cache imediatamente enquanto revalida
      const cached = clientCache.get<CartResponse>(CART_CACHE_KEY, CART_CACHE_TTL_MS)
      if (cached && !options?.silent) {
        setCartState((prev) => prev ?? cached.data)
        setCartLoaded(true)
      }

      let job: Promise<void> | null = null
      job = (async () => {
        try {
          const res = await ReadCart()
          // Se houve mutação local enquanto o GET estava em voo, descarta resposta obsoleta
          if (cartMutationVersionRef.current !== requestVersion) {
            return
          }
          clientCache.set(CART_CACHE_KEY, res)
          setCartState(res)
          setOptimisticTotal(null)
          setCartErrorVariant(null)
          setCartIsStale(false)
          setCartCachedAt(null)
        } catch (err: unknown) {
          logClientError('SessionProvider:ReadCart', err)
          if (cartMutationVersionRef.current !== requestVersion) {
            return
          }
          if (err instanceof ApiError && err.status === 401) {
            userRef.current = null
            setUser(null)
            clientCache.remove(CART_CACHE_KEY)
            setCartState(guestCartService.toCartResponse())
            setCartIsStale(false)
            setCartCachedAt(null)
            setCartErrorVariant(null)
            return
          }
          const fallbackCached = clientCache.get<CartResponse>(CART_CACHE_KEY)
          if (fallbackCached) {
            setCartState(fallbackCached.data)
            setCartIsStale(true)
            setCartCachedAt(fallbackCached.savedAt)
            setCartErrorVariant(null)
          } else {
            setCartState(null)
            setCartIsStale(false)
            setCartCachedAt(null)
            setCartErrorVariant(classifyErrorVariant(err))
          }
        } finally {
          setCartLoaded(true)
          if (cartInFlightRef.current === job) {
            cartInFlightRef.current = null
            cartInFlightVersionRef.current = -1
          }
        }
      })()

      cartInFlightRef.current = job
      return job
    },
    []
  )

  const refreshSession = useCallback(async (): Promise<UserResponse | null> => {
    if (authInFlightRef.current) {
      return authInFlightRef.current
    }

    const job = (async () => {
      try {
        const dataUser = await ReadMe()
        userRef.current = dataUser
        setUser(dataUser)
        setAuthLoaded(true)
        void loadCartForUser(dataUser)
        return dataUser
      } catch (err: unknown) {
        logClientError('SessionProvider:ReadMe', err)
        userRef.current = null
        setUser(null)
        setAuthLoaded(true)

        const cachedUserCart = clientCache.get<CartResponse>(CART_CACHE_KEY)
        const guestCart = guestCartService.toCartResponse()
        if (cachedUserCart && cachedUserCart.data.list.length > 0) {
          cartIsStaleRef.current = true
          setCartState(cachedUserCart.data)
          setCartIsStale(true)
          setCartCachedAt(cachedUserCart.savedAt)
          setCartErrorVariant(null)
        } else if (guestCart.list.length > 0) {
          cartIsStaleRef.current = false
          setCartState(guestCart)
          setCartIsStale(false)
          setCartCachedAt(null)
          setCartErrorVariant(null)
        } else {
          cartIsStaleRef.current = false
          setCartState(null)
          setCartErrorVariant(classifyErrorVariant(err))
        }
        setCartLoaded(true)
        return null
      } finally {
        authInFlightRef.current = null
      }
    })()

    authInFlightRef.current = job
    return job
  }, [loadCartForUser])

  const refreshCart = useCallback(
    async (options?: { silent?: boolean }) => {
      await loadCartForUser(userRef.current, options)
    },
    [loadCartForUser]
  )

  const clearSession = useCallback(() => {
    userRef.current = null
    setUser(null)
    setAuthLoaded(true)
    clientCache.remove(CART_CACHE_KEY)
    const guest = guestCartService.toCartResponse()
    setCartState(guest)
    setOptimisticTotal(null)
    setCartErrorVariant(null)
    setCartIsStale(false)
    setCartCachedAt(null)
    setCartLoaded(true)
  }, [])

  // Carga inicial única da sessão ao montar a aplicação
  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  useEffect(() => {
    cartIsStaleRef.current = cartIsStale
  }, [cartIsStale])

  // Sincronização do carrinho de visitante entre abas/eventos
  useEffect(() => {
    function handleGuestCartUpdate() {
      if (!userRef.current && !cartIsStaleRef.current) {
        setCartState(guestCartService.toCartResponse())
        setOptimisticTotal(null)
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === GUEST_CART_STORAGE_KEY && !userRef.current && !cartIsStaleRef.current) {
        handleGuestCartUpdate()
      }
    }

    window.addEventListener(GUEST_CART_EVENT, handleGuestCartUpdate)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(GUEST_CART_EVENT, handleGuestCartUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Atualizações otimistas instantâneas no contador do header
  useEffect(() => {
    function handleOptimistic(event: Event) {
      const custom = event as CustomEvent<CartOptimisticDetail>
      const detail = custom.detail
      if (!detail) return

      if (typeof detail.totalItems === 'number') {
        setOptimisticTotal(Math.max(0, detail.totalItems))
      } else if (typeof detail.delta === 'number') {
        setOptimisticTotal((prev) => {
          const base = prev !== null ? prev : countCartItems(cart)
          return Math.max(0, base + detail.delta!)
        })
      }

      if (detail.animate) {
        setBadgePulseKey((k) => k + 1)
      }
    }

    window.addEventListener(CART_OPTIMISTIC_EVENT, handleOptimistic)
    return () => {
      window.removeEventListener(CART_OPTIMISTIC_EVENT, handleOptimistic)
    }
  }, [cart])

  const totalCartItems = useMemo(() => {
    if (optimisticTotal !== null) return optimisticTotal
    return countCartItems(cart)
  }, [cart, optimisticTotal])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      authLoaded,
      isAuthenticated: Boolean(user),
      cart,
      setCart,
      cartLoaded,
      cartErrorVariant,
      cartIsStale,
      cartCachedAt,
      totalCartItems,
      badgePulseKey,
      refreshSession,
      refreshCart,
      clearSession,
    }),
    [
      user,
      authLoaded,
      cart,
      setCart,
      cartLoaded,
      cartErrorVariant,
      cartIsStale,
      cartCachedAt,
      totalCartItems,
      badgePulseKey,
      refreshSession,
      refreshCart,
      clearSession,
    ]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider')
  }
  return ctx
}
