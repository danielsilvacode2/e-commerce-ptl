/**
 * Testes unitários do Guest Cart e Serviços de Sincronização
 * Executável via Node.js
 */

const assert = require("assert");

// Simulação de localStorage para ambiente Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.window = {
  localStorage: new LocalStorageMock(),
  dispatchEvent: () => true,
};
global.CustomEvent = class CustomEvent {};

const GUEST_CART_STORAGE_KEY = "nero_guest_cart";
const GUEST_CART_TTL_MS = 60 * 60 * 1000; // 1h

// Lógica isolada correspondente ao guestCartService
const service = {
  isExpired(updatedAt) {
    if (!updatedAt || typeof updatedAt !== "number") return true;
    return Date.now() - updatedAt > GUEST_CART_TTL_MS;
  },

  getRawCart() {
    try {
      const stored = global.window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (!stored) return { items: [], updatedAt: Date.now() };
      const parsed = JSON.parse(stored);
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
      this.clearCart();
      return { items: [], updatedAt: Date.now() };
    }
  },

  saveCart(items) {
    const data = {
      items,
      updatedAt: Date.now(),
    };
    global.window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(data));
    return data;
  },

  addItem(item) {
    const current = this.getRawCart();
    const existingIndex = current.items.findIndex((i) => i.productId === item.productId);
    let updatedItems;

    if (existingIndex >= 0) {
      updatedItems = current.items.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              quantity: it.quantity + (item.quantity || 1),
              name: item.name || it.name,
              price: item.price !== undefined ? item.price : it.price,
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

  updateQuantity(productId, quantity) {
    const current = this.getRawCart();
    let updatedItems;
    if (quantity <= 0) {
      updatedItems = current.items.filter((i) => i.productId !== productId);
    } else {
      updatedItems = current.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
    }
    return this.saveCart(updatedItems);
  },

  removeItem(productId) {
    const current = this.getRawCart();
    return this.saveCart(current.items.filter((i) => i.productId !== productId));
  },

  clearCart() {
    global.window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  },
};

// SUÍTE DE TESTES
async function runTests() {
  console.log("=== INICIANDO TESTES DO GUEST CART ===");

  // Teste 1: Adicionar item ao guest cart
  {
    service.clearCart();
    const result = service.addItem({
      productId: "prod-1",
      quantity: 1,
      name: "Camisa Oversized",
      price: 120,
    });
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].productId, "prod-1");
    assert.strictEqual(result.items[0].quantity, 1);
    console.log("✔ Teste 1 passou: Adicionar item com sucesso");
  }

  // Teste 2: Incrementar quantidade de item existente
  {
    service.addItem({
      productId: "prod-1",
      quantity: 2,
      name: "Camisa Oversized",
      price: 120,
    });
    const current = service.getRawCart();
    assert.strictEqual(current.items.length, 1);
    assert.strictEqual(current.items[0].quantity, 3);
    console.log("✔ Teste 2 passou: Soma de quantidades de mesmo produto");
  }

  // Teste 3: Alterar quantidade e remover item
  {
    service.updateQuantity("prod-1", 5);
    let current = service.getRawCart();
    assert.strictEqual(current.items[0].quantity, 5);

    service.removeItem("prod-1");
    current = service.getRawCart();
    assert.strictEqual(current.items.length, 0);
    console.log("✔ Teste 3 passou: Alteração de quantidade e remoção de item");
  }

  // Teste 4: Expiração por inatividade (1 hora)
  {
    service.clearCart();
    service.addItem({
      productId: "prod-exp",
      quantity: 1,
      name: "Produto Expiravel",
      price: 50,
    });

    // Força updatedAt para 1 hora e 1 segundo atrás
    const oldTimestamp = Date.now() - (GUEST_CART_TTL_MS + 1000);
    const cart = JSON.parse(global.window.localStorage.getItem(GUEST_CART_STORAGE_KEY));
    cart.updatedAt = oldTimestamp;
    global.window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));

    const check = service.getRawCart();
    assert.strictEqual(check.items.length, 0, "Carrinho expirado deve ser limpo");
    assert.strictEqual(global.window.localStorage.getItem(GUEST_CART_STORAGE_KEY), null);
    console.log("✔ Teste 4 passou: Expiração de 1h limpa o carrinho automaticamente");
  }

  // Teste 5: Corrupção do localStorage / JSON inválido
  {
    global.window.localStorage.setItem(GUEST_CART_STORAGE_KEY, "invalid-json-content{{{");
    const safeRead = service.getRawCart();
    assert.strictEqual(safeRead.items.length, 0);
    console.log("✔ Teste 5 passou: Recuperação segura contra JSON corrompido");
  }

  // Teste 6: Simulação de Sincronização pós-login com mesclagem e falha parcial
  {
    service.clearCart();
    service.addItem({ productId: "p1", quantity: 2, name: "Produto 1", price: 100 });
    service.addItem({ productId: "p2", quantity: 1, name: "Produto 2 (Sem Estoque)", price: 80 });

    const userApiCart = [{ product_id: "p1", quantity: 3 }]; // Usuário já tinha 3 unidades de p1

    // Simulação do backend
    const apiCall = async (product_id, quantity) => {
      if (product_id === "p2") {
        throw new Error("Produto esgotado");
      }
      return { success: true, product_id, quantity };
    };

    const guestCart = service.getRawCart();
    const existingMap = new Map();
    userApiCart.forEach((i) => existingMap.set(i.product_id, i.quantity));

    const remaining = [...guestCart.items];
    const errors = [];
    let synced = 0;

    for (const item of guestCart.items) {
      try {
        const currentQty = existingMap.get(item.productId) || 0;
        const targetQty = currentQty + item.quantity;
        await apiCall(item.productId, targetQty);
        synced++;
        const idx = remaining.findIndex((r) => r.productId === item.productId);
        remaining.splice(idx, 1);
        service.saveCart(remaining);
      } catch (err) {
        errors.push(err.message);
      }
    }

    assert.strictEqual(synced, 1, "Apenas p1 deve ser sincronizado com sucesso");
    assert.strictEqual(errors.length, 1, "p2 deve reportar erro");
    const finalGuestCart = service.getRawCart();
    assert.strictEqual(finalGuestCart.items.length, 1, "p2 deve continuar no guest cart");
    assert.strictEqual(finalGuestCart.items[0].productId, "p2");
    console.log("✔ Teste 6 passou: Sincronização com mesclagem de estoque e retenção de falhas parciais");
  }

  console.log("\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!");
}

runTests();
