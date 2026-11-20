import ApiUrlBase from '../api';
import { OrderResponse, OrderApiEnvelope } from '@/src/types/order';

export default async function ReadOrderByIdService(orderId: string): Promise<OrderResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    if (res.status === 404) {
        throw new Error('Pedido não encontrado.');
    }

    if (!res.ok) {
        throw new Error('Erro ao carregar dados do pedido.');
    }

    const json = (await res.json()) as OrderApiEnvelope<OrderResponse>;
    const body = json['Body:'] ?? json.Body;

    if (!body) {
        throw new Error(json.Response?.mensagem ?? 'Pedido não encontrado.');
    }

    return body;
}
