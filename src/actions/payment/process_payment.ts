import ApiUrlBase from '../api';
import { OrderApiEnvelope } from '@/src/types/order';
import { PaymentResponse, ProcessPaymentPayload } from '@/src/types/payment';

export interface ProcessPaymentParams {
    orderId: string;
    idempotencyKey: string;
    payload: ProcessPaymentPayload;
}

export default async function ProcessPaymentService({
    orderId,
    idempotencyKey,
    payload,
}: ProcessPaymentParams): Promise<PaymentResponse> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    const json = (await res.json().catch(() => null)) as OrderApiEnvelope<PaymentResponse> | null;

    if (!res.ok) {
        const bodyErrors = json?.['Body:'] ?? json?.Body;
        if (Array.isArray(bodyErrors) && bodyErrors.length > 0 && bodyErrors[0]?.message) {
            throw new Error(bodyErrors[0].message);
        }
        throw new Error(json?.Response?.mensagem || 'Erro ao processar pagamento. Tente novamente.');
    }

    const body = json?.['Body:'] ?? json?.Body;
    if (!body) {
        throw new Error('Resposta inválida do servidor ao processar pagamento.');
    }

    return body;
}
