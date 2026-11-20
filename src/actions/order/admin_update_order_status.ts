import ApiUrlBase from '../api';
import { OrderStatus } from '@/src/types/order';

export interface AdminUpdateOrderStatusParams {
    orderId: string;
    status: OrderStatus;
}

export default async function AdminUpdateOrderStatusService({
    orderId,
    status,
}: AdminUpdateOrderStatusParams): Promise<void> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status: status.toUpperCase(),
        }),
    });

    if (res.status === 401 || res.status === 403) {
        throw new Error('Acesso negado.');
    }

    if (res.status === 400 || res.status === 422) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.Response?.mensagem || 'Transição de status inválida.');
    }

    if (!res.ok) {
        throw new Error('Erro ao atualizar status do pedido.');
    }
}
