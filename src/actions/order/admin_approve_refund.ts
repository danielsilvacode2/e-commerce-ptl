import ApiUrlBase from '../api';
import { OrderApiEnvelope, OrderResponse } from '@/src/types/order';

export default async function AdminApproveRefundService(orderId: string): Promise<OrderResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/refund/approve`, {
        method: 'PUT',
        credentials: 'include',
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    const json = (await res.json().catch(() => null)) as OrderApiEnvelope<OrderResponse> | null;

    if (!res.ok) {
        throw new Error(json?.Response?.mensagem || 'Erro ao aprovar estorno.');
    }

    const body = json?.['Body:'] ?? json?.Body;
    if (!body) {
        throw new Error('Resposta inválida ao aprovar estorno.');
    }

    return body;
}
