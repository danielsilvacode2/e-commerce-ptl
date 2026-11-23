export type PaymentStatus = 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD';

export interface PaymentResponse {
    id: string;
    order_id: string;
    provider: string;
    method: PaymentMethod;
    external_payment_id?: string;
    idempotency_key: string;
    amount: number;
    installments: number;
    status: PaymentStatus;
    pix_qr_code?: string;
    pix_copy_paste?: string;
    card_last4?: string;
    card_brand?: string;
    expires_at?: string;
    paid_at?: string;
    refunded_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ProcessPaymentPayload {
    method: PaymentMethod;
    installments?: number;
    payer_doc_type?: string;
    payer_doc_number?: string;
    card_token?: string;
    payment_method_id?: string;
    card_number?: string;
    card_holder_name?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    card_cvv?: string;
}
