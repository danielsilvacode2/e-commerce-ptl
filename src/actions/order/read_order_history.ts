import ApiUrlBase from '../api';
import { OrderStatusHistoryResponse, OrderApiEnvelope } from '@/src/types/order';

export default async function ReadOrderHistoryService(orderId: string): Promise<OrderStatusHistoryResponse[]> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/history`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    if (!res.ok) {
        throw new Error('Erro ao buscar histórico do pedido.');
    }

    const json = (await res.json()) as OrderApiEnvelope<OrderStatusHistoryResponse[]>;
    const body = json['Body:'] ?? json.Body;

    return body ?? [];
}
