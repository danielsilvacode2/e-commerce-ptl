'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import NavProducts from '@/src/components/products/nav/nav';
import AdminOrderDetailClient from '@/src/components/admin/pedidos/detalhe/detalhe';
import ReadMe from '@/src/actions/me/readMe';

interface AdminOrderDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        ReadMe()
            .then((dataUser) => {
                if (dataUser?.role !== 'admin') {
                    router.push('/');
                } else {
                    setAuthorized(true);
                }
            })
            .catch(() => {
                router.push('/');
            });
    }, [router]);

    if (!authorized) {
        return null;
    }

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans text-black">
            <NavProducts active="orders" />
            <AdminOrderDetailClient orderId={id} />
        </div>
    );
}
