import HeaderHome from '@/src/components/home/header/header';
import OrderDetailClient from '@/src/components/pedidos/detalhe/detalhe';

interface OrderDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { id } = await params;

    return (
        <div className="min-h-screen overflow-x-clip bg-[#121212] text-[#eaeaea]">
            <HeaderHome />
            <OrderDetailClient orderId={id} />
        </div>
    );
}
