import { OrderStatus } from '@/src/types/order';

export interface OrderStatusConfig {
    label: string;
    description: string;
    badgeClass: string;
    borderClass: string;
    textClass: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = {
    PREPARING: {
        label: 'Em Separação',
        description: 'Seu pedido está sendo preparado no centro de distribuição.',
        badgeClass: 'border-[#ff6a00] text-[#ff6a00] bg-[#ff6a00]/10',
        borderClass: 'border-[#ff6a00]',
        textClass: 'text-[#ff6a00]',
    },
    SHIPPED: {
        label: 'Enviado',
        description: 'Pedido a caminho do endereço de entrega informado.',
        badgeClass: 'border-blue-500 text-blue-400 bg-blue-500/10',
        borderClass: 'border-blue-500',
        textClass: 'text-blue-400',
    },
    DELIVERED: {
        label: 'Entregue',
        description: 'Pedido entregue com sucesso.',
        badgeClass: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
        borderClass: 'border-emerald-500',
        textClass: 'text-emerald-400',
    },
    CANCELED: {
        label: 'Cancelado',
        description: 'Este pedido foi cancelado.',
        badgeClass: 'border-red-500 text-red-400 bg-red-500/10',
        borderClass: 'border-red-500',
        textClass: 'text-red-400',
    },
};

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PREPARING: ['SHIPPED', 'CANCELED'],
    SHIPPED: ['DELIVERED', 'CANCELED'],
    DELIVERED: [],
    CANCELED: [],
};

export function isFinalStatus(status: OrderStatus): boolean {
    return status === 'DELIVERED' || status === 'CANCELED';
}

export function canCancelOrder(status: OrderStatus): boolean {
    return status === 'PREPARING';
}

export function getStatusConfig(status: string): OrderStatusConfig {
    const key = status?.toUpperCase() as OrderStatus;
    return (
        ORDER_STATUS_MAP[key] ?? {
            label: status || 'Desconhecido',
            description: '',
            badgeClass: 'border-neutral-500 text-neutral-400 bg-neutral-500/10',
            borderClass: 'border-neutral-500',
            textClass: 'text-neutral-400',
        }
    );
}
