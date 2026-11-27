import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckoutPageClient from '@/src/components/checkout/checkout-page'
import { createListMyAddressesUseCase } from '@/src/services/address'
import { createCreateOrderUseCase } from '@/src/services/order'
import { Address } from '@/src/types/address'
import { OrderResponse } from '@/src/types/order'
import { CartResponse } from '@/src/actions/cart/read_all'

const pushMock = vi.fn()
const replaceMock = vi.fn()
const setCartMock = vi.fn()
const refreshCartMock = vi.fn()

let mockSessionState: {
  authLoaded: boolean
  isAuthenticated: boolean
  cart: CartResponse | null
  cartLoaded: boolean
  cartErrorVariant: null
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}))

vi.mock('@/src/components/providers/session-provider', () => ({
  useSession: () => ({
    ...mockSessionState,
    setCart: setCartMock,
    refreshCart: refreshCartMock,
  }),
}))

const savedAddressesFixture: Address[] = [
  {
    id: 'addr-1',
    cep: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Conj 101',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  {
    id: 'addr-2',
    cep: '20040020',
    street: 'Avenida Rio Branco',
    number: '50',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
]

const cartFixture: CartResponse = {
  id: 'cart-1',
  list: [
    {
      id: 'item-1',
      product_id: 'prod-1',
      name: 'Jaqueta Nero Black',
      price: '250.00',
      quantity: 2,
      sku: 'NR-001',
      image: '',
      isSelect: true,
    },
    {
      id: 'item-2',
      product_id: 'prod-2',
      name: 'Camiseta Não Selecionada',
      price: '99.00',
      quantity: 1,
      sku: 'NR-002',
      image: '',
      isSelect: false,
    },
  ],
}

const createdOrderFixture: OrderResponse = {
  id: 'order-999',
  user: {
    id: 'user-1',
    name: 'Daniel Alves',
    email: 'daniel@example.com',
  },
  address: savedAddressesFixture[1],
  status: 'PENDING_PAYMENT',
  total: 500,
  items: [],
  created_at: '2026-11-26T20:00:00Z',
  update_at: '2026-11-26T20:00:00Z',
}

describe('CheckoutPageClient', () => {
  beforeEach(() => {
    pushMock.mockReset()
    replaceMock.mockReset()
    setCartMock.mockReset()
    refreshCartMock.mockReset().mockResolvedValue(undefined)
    mockSessionState = {
      authLoaded: true,
      isAuthenticated: true,
      cart: cartFixture,
      cartLoaded: true,
      cartErrorVariant: null,
    }
  })

  it('exibe os itens selecionados, permite confirmar com endereço salvo e redireciona para pagamento', async () => {
    const user = userEvent.setup()
    const listAddressesUC = createListMyAddressesUseCase({
      listMyAddresses: vi.fn().mockResolvedValue(savedAddressesFixture),
    })
    const createOrderSpy = vi.fn().mockResolvedValue(createdOrderFixture)
    const createOrderUC = createCreateOrderUseCase({
      createOrder: createOrderSpy,
    })

    render(
      <CheckoutPageClient
        listAddressesUC={listAddressesUC}
        createOrderUC={createOrderUC}
      />
    )

    // Mostra apenas o item selecionado
    expect(screen.getByText('Jaqueta Nero Black')).toBeInTheDocument()
    expect(screen.queryByText('Camiseta Não Selecionada')).not.toBeInTheDocument()

    // Carrega endereços salvos e permite trocar para o segundo
    const secondOption = await screen.findByText(/Avenida Rio Branco, 50/)
    await user.click(secondOption)

    await user.click(screen.getByRole('button', { name: /Confirmar e Ir para Pagamento/i }))

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith({ addressId: 'addr-2' })
    })
    expect(pushMock).toHaveBeenCalledWith('/pedidos/order-999/pagamento')
  })

  it('mostra estado vazio quando nenhum item do carrinho está selecionado', async () => {
    mockSessionState.cart = {
      id: 'cart-1',
      list: [cartFixture.list[1]],
    }
    const listAddressesUC = createListMyAddressesUseCase({
      listMyAddresses: vi.fn().mockResolvedValue([]),
    })
    const createOrderUC = createCreateOrderUseCase({
      createOrder: vi.fn(),
    })

    render(
      <CheckoutPageClient
        listAddressesUC={listAddressesUC}
        createOrderUC={createOrderUC}
      />
    )

    expect(
      await screen.findByText(/Nenhum item selecionado para checkout/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o Carrinho/i })).toHaveAttribute(
      'href',
      '/carrinho'
    )
  })
})
