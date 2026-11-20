import ApiUrlBase from '../api';
import { OrderResponse, OrderApiEnvelope } from '@/src/types/order';

export interface CreateOrderParams {
    zip_code: string;
}

export default async function CreateOrderService({ zip_code }: CreateOrderParams): Promise<OrderResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zip_code }),
    });

    if (res.status === 401) {
        throw new Error('Sua sessão expirou. Faça login novamente.');
    }

    if (res.status === 400 || res.status === 422) {
        const errorData = await res.json().catch(() => null);
        const msg = errorData?.Response?.mensagem || 'Dados de CEP ou carrinho inválidos.';
        throw new Error(msg);
    }

    if (res.status === 409) {
        throw new Error('Conflito de estoque ao finalizar pedido. Verifique seu carrinho.');
    }

    if (!res.ok) {
        throw new Error('Erro ao criar pedido. Tente novamente mais tarde.');
    }

    const json = (await res.json()) as OrderApiEnvelope<OrderResponse>;
    const body = json['Body:'] ?? json.Body;

    if (!body) {
        throw new Error(json.Response?.mensagem ?? 'Resposta inválida do servidor ao criar pedido.');
    }

    return body;
}
