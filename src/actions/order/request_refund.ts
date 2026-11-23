import ApiUrlBase from '../api';
import { OrderApiEnvelope, OrderResponse } from '@/src/types/order';

export default async function RequestRefundService(
    orderId: string,
    reason?: string
): Promise<OrderResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/refund`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason ?? '' }),
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    const json = (await res.json().catch(() => null)) as OrderApiEnvelope<OrderResponse> | null;

    if (!res.ok) {
        throw new Error(
            json?.Response?.mensagem || 'Não foi possível solicitar o estorno para este pedido.'
        );
    }

    const body = json?.['Body:'] ?? json?.Body;
    if (!body) {
        throw new Error('Resposta inválida ao solicitar estorno.');
    }

    return body;
}
