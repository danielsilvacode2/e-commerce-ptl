import ApiUrlBase from '../api';
import { OrderApiEnvelope } from '@/src/types/order';
import { PaymentResponse } from '@/src/types/payment';

export default async function ReadPaymentService(orderId: string): Promise<PaymentResponse | null> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/orders/${orderId}/payment`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw new Error('Erro ao consultar pagamento.');
    }

    const json = (await res.json()) as OrderApiEnvelope<PaymentResponse>;
    return json['Body:'] ?? json.Body ?? null;
}
