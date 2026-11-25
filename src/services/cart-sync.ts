import CreateCart from "@/src/actions/cart/create_cart";
import ReadCart from "@/src/actions/cart/read_all";
import { guestCartService, GuestCartItem } from "./guest-cart";

let isSyncing = false;

export interface SyncCartResult {
  syncedCount: number;
  failedItems: GuestCartItem[];
  errors: string[];
}

export const cartSyncService = {
  /**
   * Sincroniza os itens do carrinho temporário com a API do usuário logado em paralelo.
   * - Protegido contra duplo disparo simultâneo.
   * - Agrupa entradas duplicadas por productId antes do envio.
   * - Mescla quantidades com o que já existe na API e envia em paralelo via Promise.allSettled.
   * - Grava o localStorage apenas uma vez ao final, preservando itens que falharem.
   */
  async syncGuestCartToUser(): Promise<SyncCartResult> {
    if (isSyncing) {
      return { syncedCount: 0, failedItems: [], errors: ["Sincronização já em andamento"] };
    }

    const guestCart = guestCartService.getRawCart();
    if (!guestCart.items || guestCart.items.length === 0) {
      return { syncedCount: 0, failedItems: [], errors: [] };
    }

    isSyncing = true;

    const failedItems: GuestCartItem[] = [];
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // 1. Lê os itens que o usuário já possui no carrinho da API para mesclar quantidades
      const existingQuantities = new Map<string, number>();
      try {
        const userCart = await ReadCart();
        if (userCart && Array.isArray(userCart.list)) {
          for (const item of userCart.list) {
            existingQuantities.set(item.product_id, item.quantity);
          }
        }
      } catch {
        // Se falhar ao buscar carrinho existente (ex: carrinho ainda não criado), prossegue considerando 0
      }

      // 2. Agrupa itens por productId para evitar concorrência no mesmo produto
      const mergedGuestMap = new Map<string, GuestCartItem>();
      for (const item of guestCart.items) {
        const existing = mergedGuestMap.get(item.productId);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
        } else {
          mergedGuestMap.set(item.productId, { ...item, quantity: item.quantity || 1 });
        }
      }

      const itemsToSync = Array.from(mergedGuestMap.values());

      // 3. Envia todos os itens distintos em paralelo para eliminar o gargalo sequencial pós-login
      const results = await Promise.allSettled(
        itemsToSync.map(async (item) => {
          const currentInApi = existingQuantities.get(item.productId) || 0;
          const targetQuantity = currentInApi + (item.quantity || 1);

          await CreateCart({
            product_id: item.productId,
            quantity: targetQuantity,
          });

          return item;
        })
      );

      results.forEach((result, index) => {
        const item = itemsToSync[index];
        if (result.status === "fulfilled") {
          syncedCount++;
        } else {
          failedItems.push(item);
          const msg =
            result.reason instanceof Error ? result.reason.message : "Erro desconhecido";
          errors.push(`Falha ao sincronizar ${item.name}: ${msg}`);
        }
      });

      // 4. Persiste o estado final no guest cart em uma única operação de I/O
      if (failedItems.length === 0) {
        guestCartService.clearCart();
      } else {
        guestCartService.saveCart(failedItems);
      }

      return {
        syncedCount,
        failedItems,
        errors,
      };
    } finally {
      isSyncing = false;
    }
  },
};
