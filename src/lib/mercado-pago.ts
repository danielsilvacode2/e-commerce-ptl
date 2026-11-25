// Integração client-side com o Mercado Pago JS SDK v2 para tokenização segura de cartão

interface MercadoPagoTokenResponse {
    id: string;
}

interface MercadoPagoPaymentMethodsResponse {
    results?: Array<{ id: string }>;
}

interface MercadoPagoInstance {
    createCardToken: (params: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType: string;
        identificationNumber: string;
    }) => Promise<MercadoPagoTokenResponse>;
    getPaymentMethods: (params: { bin: string }) => Promise<MercadoPagoPaymentMethodsResponse>;
}

declare global {
    interface Window {
        MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
    }
}

const MP_SDK_URL = 'https://sdk.mercadopago.com/js/v2';

let sdkLoadPromise: Promise<void> | null = null;

export function getMercadoPagoPublicKey(): string {
    return (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? '').trim();
}

export function isMercadoPagoEnabled(): boolean {
    return getMercadoPagoPublicKey().length > 0;
}

/**
 * Pré-carrega o SDK do Mercado Pago em segundo plano (ex.: ao abrir a aba de cartão),
 * evitando atraso perceptível no clique do botão Pagar.
 */
export function preloadMercadoPagoSDK(): void {
    if (typeof window === 'undefined' || !isMercadoPagoEnabled()) return;
    void loadMercadoPagoSDK().catch(() => {
        // Falha silenciosa no pré-carregamento; será retentada na submissão
        sdkLoadPromise = null;
    });
}

function loadMercadoPagoSDK(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('SDK do Mercado Pago disponível apenas no navegador.'));
    }

    if (window.MercadoPago) {
        return Promise.resolve();
    }

    if (sdkLoadPromise) {
        return sdkLoadPromise;
    }

    sdkLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${MP_SDK_URL}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Falha ao carregar SDK do Mercado Pago.')));
            return;
        }

        const script = document.createElement('script');
        script.src = MP_SDK_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago.'));
        document.head.appendChild(script);
    });

    return sdkLoadPromise;
}

function detectFallbackPaymentMethodId(digits: string): string {
    if (digits.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'master';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(digits)) return 'elo';
    if (/^(606282|3841)/.test(digits)) return 'hipercard';
    return 'visa';
}

export interface TokenizeCardInput {
    cardNumber: string;
    cardHolderName: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    cpf: string;
}

export interface TokenizeCardResult {
    cardToken: string;
    paymentMethodId: string;
}

export async function tokenizeCardWithMercadoPago(
    input: TokenizeCardInput
): Promise<TokenizeCardResult> {
    const publicKey = getMercadoPagoPublicKey();
    if (!publicKey) {
        throw new Error('Chave pública do Mercado Pago não configurada.');
    }

    await loadMercadoPagoSDK();

    if (!window.MercadoPago) {
        throw new Error('SDK do Mercado Pago indisponível no momento.');
    }

    const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
    const digits = input.cardNumber.replace(/\D/g, '');
    const cpfDigits = input.cpf.replace(/\D/g, '');

    const paymentMethodPromise: Promise<string> =
        digits.length >= 6
            ? mp
                  .getPaymentMethods({ bin: digits.slice(0, 6) })
                  .then((pmRes) => pmRes?.results?.[0]?.id || detectFallbackPaymentMethodId(digits))
                  .catch(() => detectFallbackPaymentMethodId(digits))
            : Promise.resolve(detectFallbackPaymentMethodId(digits));

    const tokenPromise = mp.createCardToken({
        cardNumber: digits,
        cardholderName: input.cardHolderName.trim().toUpperCase(),
        cardExpirationMonth: input.expMonth.padStart(2, '0'),
        cardExpirationYear: input.expYear.length === 2 ? `20${input.expYear}` : input.expYear,
        securityCode: input.cvv.replace(/\D/g, ''),
        identificationType: 'CPF',
        identificationNumber: cpfDigits,
    });

    let paymentMethodId: string;
    let tokenRes: MercadoPagoTokenResponse;
    try {
        [paymentMethodId, tokenRes] = await Promise.all([paymentMethodPromise, tokenPromise]);
    } catch (err: unknown) {
        throw new Error(extractMercadoPagoErrorMessage(err));
    }

    if (!tokenRes?.id) {
        throw new Error('Não foi possível tokenizar o cartão no Mercado Pago. Verifique os dados informados.');
    }

    return {
        cardToken: tokenRes.id,
        paymentMethodId,
    };
}

function extractMercadoPagoErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) {
        return err.message;
    }
    if (Array.isArray(err)) {
        const msgs = err
            .map((item) => {
                if (item && typeof item === 'object' && 'message' in item) {
                    const code = 'code' in item ? `${String(item.code)}: ` : '';
                    return `${code}${String(item.message)}`;
                }
                return '';
            })
            .filter(Boolean);
        if (msgs.length > 0) {
            return `Mercado Pago: ${msgs.join('; ')}`;
        }
    }
    if (err && typeof err === 'object' && 'message' in err) {
        return `Mercado Pago: ${String((err as { message: unknown }).message)}`;
    }
    return 'Não foi possível tokenizar o cartão no Mercado Pago. Verifique os dados informados.';
}
