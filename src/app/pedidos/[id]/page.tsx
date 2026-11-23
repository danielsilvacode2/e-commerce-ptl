import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import HeaderHome from '@/src/components/home/header/header';
import OrderDetailClient from '@/src/components/pedidos/detalhe/detalhe';

interface OrderDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

async function OrderDetailContent({ params }: OrderDetailPageProps) {
    const { id } = await params;
    return <OrderDetailClient orderId={id} />;
}

function OrderDetailLoadingFallback() {
    return (
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
            <Loader2 size={36} className="animate-spin text-black dark:text-white" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Carregando detalhes do pedido...
            </p>
        </main>
    );
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
    return (
        <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#121212] text-black dark:text-white transition-colors">
            <HeaderHome />
            <Suspense fallback={<OrderDetailLoadingFallback />}>
                <OrderDetailContent params={params} />
            </Suspense>
        </div>
    );
}
