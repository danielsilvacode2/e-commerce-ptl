import { CartResponse, ProductCartResponse } from "@/src/actions/cart/read_all";

export const GUEST_CART_STORAGE_KEY = "nero_guest_cart";
export const GUEST_CART_TTL_MS = 60 * 60 * 1000; // 1 hora de inatividade
export const GUEST_CART_EVENT = "guest_cart_changed";

export interface GuestCartItem {
  productId: string;
  quantity: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  image: string;
  isSelect?: boolean;
}

export interface GuestCartData {
  items: GuestCartItem[];
  updatedAt: number;
}

// Fallback em memória caso o localStorage esteja desabilitado ou inacessível (ex: navegação anônima restrita)
let memoryCart: GuestCartData | null = null;

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const testKey = "__cart_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function notifyCartChange(): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(GUEST_CART_EVENT));
    } catch {
      // Ignora erro em ambientes sem CustomEvent
    }
  }
}

export const guestCartService = {
  isExpired(updatedAt: number): boolean {
    if (!updatedAt || typeof updatedAt !== "number") return true;
    return Date.now() - updatedAt > GUEST_CART_TTL_MS;
  },

  getRawCart(): GuestCartData {
    if (!isLocalStorageAvailable()) {
      if (!memoryCart) {
        memoryCart = { items: [], updatedAt: Date.now() };
      }
      if (this.isExpired(memoryCart.updatedAt)) {
        memoryCart = { items: [], updatedAt: Date.now() };
      }
      return memoryCart;
    }

    try {
      const stored = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (!stored) {
        return { items: [], updatedAt: Date.now() };
      }

      const parsed: GuestCartData = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.items) || typeof parsed.updatedAt !== "number") {
        this.clearCart();
        return { items: [], updatedAt: Date.now() };
      }

      if (this.isExpired(parsed.updatedAt)) {
        this.clearCart();
        return { items: [], updatedAt: Date.now() };
      }

      return parsed;
    } catch {
      // JSON corrompido ou erro de leitura: reinicia com segurança
      this.clearCart();
      return { items: [], updatedAt: Date.now() };
    }
  },

  saveCart(items: GuestCartItem[]): GuestCartData {
    const data: GuestCartData = {
      items,
      updatedAt: Date.now(),
    };

    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(data));
      } catch {
        memoryCart = data;
      }
    } else {
      memoryCart = data;
    }

    notifyCartChange();
    return data;
  },

  addItem(item: Omit<GuestCartItem, "isSelect"> & { isSelect?: boolean }): GuestCartData {
    const current = this.getRawCart();
    const existingIndex = current.items.findIndex((i) => i.productId === item.productId);

    let updatedItems: GuestCartItem[];

    if (existingIndex >= 0) {
      updatedItems = current.items.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              quantity: it.quantity + (item.quantity || 1),
              name: item.name || it.name,
              price: item.price ?? it.price,
              image: item.image || it.image,
            }
          : it
      );
    } else {
      updatedItems = [
        ...current.items,
        {
          productId: item.productId,
          quantity: item.quantity || 1,
          name: item.name,
          sku: item.sku || "",
          description: item.description || "",
          price: item.price,
          image: item.image || "",
          isSelect: item.isSelect !== undefined ? item.isSelect : true,
        },
      ];
    }

    return this.saveCart(updatedItems);
  },

  updateQuantity(productId: string, quantity: number): GuestCartData {
    const current = this.getRawCart();
    let updatedItems: GuestCartItem[];

    if (quantity <= 0) {
      updatedItems = current.items.filter((i) => i.productId !== productId);
    } else {
      updatedItems = current.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
    }

    return this.saveCart(updatedItems);
  },

  toggleSelect(productId: string, isSelect: boolean): GuestCartData {
    const current = this.getRawCart();
    const updatedItems = current.items.map((i) =>
      i.productId === productId ? { ...i, isSelect } : i
    );
    return this.saveCart(updatedItems);
  },

  toggleSelectAll(isSelect: boolean): GuestCartData {
    const current = this.getRawCart();
    const updatedItems = current.items.map((i) => ({ ...i, isSelect }));
    return this.saveCart(updatedItems);
  },

  removeItem(productId: string): GuestCartData {
    const current = this.getRawCart();
    const updatedItems = current.items.filter((i) => i.productId !== productId);
    return this.saveCart(updatedItems);
  },

  clearCart(): void {
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } catch {
        // Ignora erro
      }
    }
    memoryCart = { items: [], updatedAt: Date.now() };
    notifyCartChange();
  },

  checkExpiration(): boolean {
    const current = this.getRawCart();
    return current.items.length === 0;
  },

  toCartResponse(guestData?: GuestCartData): CartResponse {
    const data = guestData ?? this.getRawCart();

    const list: ProductCartResponse[] = data.items.map((item) => ({
      id: item.productId, // Usa productId como id no formato de resposta
      product_id: item.productId,
      name: item.name,
      sku: item.sku,
      description: item.description,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      isSelect: item.isSelect !== undefined ? item.isSelect : true,
    }));

    return {
      id: "guest-cart",
      user: {
        id: "guest",
        name: "Visitante",
        email: "",
        role: "guest",
      },
      list,
    };
  },
};
