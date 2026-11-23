import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import HeaderHome from '@/src/components/home/header/header';
import OrderPaymentClient from '@/src/components/pedidos/pagamento/pagamento';

export const metadata: Metadata = {
    title: 'Pagamento do Pedido | NERO',
    description: 'Finalize o pagamento do seu pedido via Pix ou Cartão de Crédito com segurança.',
};

interface OrderPaymentPageProps {
    params: Promise<{
        id: string;
    }>;
}

async function OrderPaymentContent({ params }: OrderPaymentPageProps) {
    const { id } = await params;
    return <OrderPaymentClient orderId={id} />;
}

function PaymentLoadingFallback() {
    return (
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
            <Loader2 size={36} className="animate-spin text-black dark:text-white" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Carregando checkout de pagamento...
            </p>
        </main>
    );
}

export default function OrderPaymentPage({ params }: OrderPaymentPageProps) {
    return (
        <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#121212] text-black dark:text-white transition-colors">
            <HeaderHome />
            <Suspense fallback={<PaymentLoadingFallback />}>
                <OrderPaymentContent params={params} />
            </Suspense>
        </div>
    );
}
