"use client";

import { useEffect, useState, useCallback } from "react";
import {
  guestCartService,
  GuestCartData,
  GUEST_CART_STORAGE_KEY,
  GUEST_CART_EVENT,
} from "./guest-cart";
import { CartResponse } from "@/src/actions/cart/read_all";

export function useGuestCart() {
  const [cartData, setCartData] = useState<GuestCartData>({
    items: [],
    updatedAt: Date.now(),
  });
  const [mounted, setMounted] = useState(false);

  const reloadCart = useCallback(() => {
    const raw = guestCartService.getRawCart();
    setCartData(raw);
  }, []);

  useEffect(() => {
    setMounted(true);
    reloadCart();

    // 1. Escuta mudanças em outras abas
    function handleStorageChange(event: StorageEvent) {
      if (event.key === GUEST_CART_STORAGE_KEY) {
        reloadCart();
      }
    }

    // 2. Escuta mudanças na mesma aba
    function handleCustomEvent() {
      reloadCart();
    }

    // 3. Ao voltar para a aba ou focar na janela, verifica expiração (1h)
    function handleVisibility() {
      if (!document.hidden) {
        reloadCart();
      }
    }

    function handleFocus() {
      reloadCart();
    }

    // 4. Verificação periódica enquanto a aba estiver aberta (a cada 30 segundos)
    const intervalTimer = setInterval(() => {
      reloadCart();
    }, 30000);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(GUEST_CART_EVENT, handleCustomEvent);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(GUEST_CART_EVENT, handleCustomEvent);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [reloadCart]);

  const cartResponse: CartResponse = guestCartService.toCartResponse(cartData);
  const totalItems = cartData.items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return {
    cartData,
    cartResponse,
    totalItems,
    mounted,
    addItem: (item: Parameters<typeof guestCartService.addItem>[0]) => {
      const res = guestCartService.addItem(item);
      setCartData(res);
      return res;
    },
    updateQuantity: (productId: string, quantity: number) => {
      const res = guestCartService.updateQuantity(productId, quantity);
      setCartData(res);
      return res;
    },
    removeItem: (productId: string) => {
      const res = guestCartService.removeItem(productId);
      setCartData(res);
      return res;
    },
    toggleSelect: (productId: string, isSelect: boolean) => {
      const res = guestCartService.toggleSelect(productId, isSelect);
      setCartData(res);
      return res;
    },
    toggleSelectAll: (isSelect: boolean) => {
      const res = guestCartService.toggleSelectAll(isSelect);
      setCartData(res);
      return res;
    },
    clearCart: () => {
      guestCartService.clearCart();
      setCartData({ items: [], updatedAt: Date.now() });
    },
    reloadCart,
  };
}
