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
   * Sincroniza os itens do carrinho temporário com a API do usuário logado.
   * - Protegido contra duplo disparo simultâneo.
   * - Mescla quantidades se o usuário já tiver o mesmo produto no carrinho no banco.
   * - Limpa do guest cart apenas os itens sincronizados com sucesso.
   * - Mantém os que falharem para não perder dados do usuário.
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

      // 2. Itera sobre cada item do guest cart e envia para a API
      const remainingItems = [...guestCart.items];

      for (const item of guestCart.items) {
        try {
          const currentInApi = existingQuantities.get(item.productId) || 0;
          // Soma a quantidade do guest cart com a que o usuário já possui na API
          const targetQuantity = currentInApi + (item.quantity || 1);

          await CreateCart({
            product_id: item.productId,
            quantity: targetQuantity,
          });

          // Atualiza o mapa caso tenha mais de uma entrada ou repetição
          existingQuantities.set(item.productId, targetQuantity);
          syncedCount++;

          // Remove este item específico da lista de pendentes no guest cart
          const itemIndex = remainingItems.findIndex((i) => i.productId === item.productId);
          if (itemIndex >= 0) {
            remainingItems.splice(itemIndex, 1);
            guestCartService.saveCart(remainingItems);
          }
        } catch (err: unknown) {
          failedItems.push(item);
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          errors.push(`Falha ao sincronizar ${item.name}: ${msg}`);
        }
      }

      // 3. Se todos os itens foram sincronizados, limpa o carrinho
      if (remainingItems.length === 0) {
        guestCartService.clearCart();
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
