'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavProducts from '@/src/components/products/nav/nav';
import MainNovoProducts from '@/src/components/products/novo/main/main';
import ReadMe from '@/src/actions/me/readMe';

export default function NewProductPage() {
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
            <NavProducts active="new" />
            <MainNovoProducts />
        </div>
    );
}
