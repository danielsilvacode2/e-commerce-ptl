import ApiUrlBase from '../api';
import { OrderApiEnvelope } from '@/src/types/order';
import { PaymentResponse } from '@/src/types/payment';

export type ConfirmPaymentAction = 'APPROVE' | 'FAIL' | 'EXPIRE';

export default async function ConfirmPaymentService(
    orderId: string,
    action: ConfirmPaymentAction
): Promise<PaymentResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/payment/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    const json = (await res.json().catch(() => null)) as OrderApiEnvelope<PaymentResponse> | null;

    if (!res.ok) {
        throw new Error(json?.Response?.mensagem || 'Erro ao atualizar status do pagamento.');
    }

    const body = json?.['Body:'] ?? json?.Body;
    if (!body) {
        throw new Error('Resposta inválida ao atualizar pagamento.');
    }

    return body;
}
