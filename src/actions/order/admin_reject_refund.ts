import ApiUrlBase from '../api';
import { OrderApiEnvelope, OrderResponse } from '@/src/types/order';

export default async function AdminRejectRefundService(
    orderId: string,
    reason: string
): Promise<OrderResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/refund/reject`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    const json = (await res.json().catch(() => null)) as OrderApiEnvelope<OrderResponse> | null;

    if (!res.ok) {
        throw new Error(json?.Response?.mensagem || 'Erro ao recusar estorno.');
    }

    const body = json?.['Body:'] ?? json?.Body;
    if (!body) {
        throw new Error('Resposta inválida ao recusar estorno.');
    }

    return body;
}
