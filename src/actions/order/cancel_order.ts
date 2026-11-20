import ApiUrlBase from '../api';

export default async function CancelOrderService(orderId: string): Promise<void> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/cancel`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    if (res.status === 409 || res.status === 422 || res.status === 400) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.Response?.mensagem || 'Não é possível cancelar o pedido neste estágio.');
    }

    if (!res.ok) {
        throw new Error('Erro ao cancelar pedido.');
    }
}
