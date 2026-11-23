import { OrderStatus } from '@/src/types/order';

export interface OrderStatusConfig {
    label: string;
    description: string;
    badgeClass: string;
    borderClass: string;
    textClass: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = {
    PENDING_PAYMENT: {
        label: 'Aguardando Pagamento',
        description: 'Finalize o pagamento para que seu pedido entre em preparação.',
        badgeClass: 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10',
        borderClass: 'border-amber-500',
        textClass: 'text-amber-700 dark:text-amber-400',
    },
    PREPARING: {
        label: 'Em Preparação',
        description: 'Pagamento confirmado! Seu pedido está sendo preparado no centro de distribuição.',
        badgeClass: 'border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-500/10',
        borderClass: 'border-orange-500',
        textClass: 'text-orange-700 dark:text-orange-400',
    },
    SHIPPED: {
        label: 'Enviado',
        description: 'Pedido em trânsito a caminho do endereço de entrega informado.',
        badgeClass: 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-500/10',
        borderClass: 'border-blue-500',
        textClass: 'text-blue-700 dark:text-blue-400',
    },
    DELIVERED: {
        label: 'Entregue',
        description: 'Pedido entregue com sucesso.',
        badgeClass: 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
        borderClass: 'border-emerald-500',
        textClass: 'text-emerald-700 dark:text-emerald-400',
    },
    CANCELED: {
        label: 'Cancelado',
        description: 'Este pedido foi cancelado.',
        badgeClass: 'border-red-500 text-red-700 dark:text-red-400 bg-red-500/10',
        borderClass: 'border-red-500',
        textClass: 'text-red-700 dark:text-red-400',
    },
    REFUND_REQUESTED: {
        label: 'Estorno Solicitado',
        description: 'Sua solicitação de estorno está em análise pela nossa equipe.',
        badgeClass: 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-500/10',
        borderClass: 'border-purple-500',
        textClass: 'text-purple-700 dark:text-purple-400',
    },
    REFUNDED: {
        label: 'Estornado',
        description: 'O estorno deste pedido foi autorizado e concluído.',
        badgeClass: 'border-neutral-500 text-neutral-700 dark:text-neutral-300 bg-neutral-500/10',
        borderClass: 'border-neutral-500',
        textClass: 'text-neutral-700 dark:text-neutral-300',
    },
};

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING_PAYMENT: ['CANCELED'],
    PREPARING: ['SHIPPED', 'CANCELED'],
    SHIPPED: ['DELIVERED', 'CANCELED'],
    DELIVERED: [],
    CANCELED: [],
    REFUND_REQUESTED: [],
    REFUNDED: [],
};

export function isFinalStatus(status: OrderStatus): boolean {
    return status === 'CANCELED' || status === 'REFUNDED';
}

export function canPayOrder(status: OrderStatus): boolean {
    return status === 'PENDING_PAYMENT';
}

export function canCancelOrder(status: OrderStatus): boolean {
    return status === 'PENDING_PAYMENT';
}

export function canAutoRefundOrder(status: OrderStatus): boolean {
    return status === 'PREPARING';
}

export function canRequestAdminRefundOrder(status: OrderStatus): boolean {
    return status === 'DELIVERED';
}

export function isRefundBlockedInTransit(status: OrderStatus): boolean {
    return status === 'SHIPPED';
}

export function getStatusConfig(status: string): OrderStatusConfig {
    const key = status?.toUpperCase() as OrderStatus;
    return (
        ORDER_STATUS_MAP[key] ?? {
            label: status || 'Desconhecido',
            description: '',
            badgeClass: 'border-neutral-500 text-neutral-600 bg-neutral-500/10',
            borderClass: 'border-neutral-500',
            textClass: 'text-neutral-600',
        }
    );
}
