import HeaderHome from '@/src/components/home/header/header';
import FooterHome from '@/src/components/home/footer/footer';
import MyOrdersClient from '@/src/components/pedidos/main/main';

export const metadata = {
    title: 'Meus Pedidos | NERO',
    description: 'Acompanhe todos os seus pedidos realizados na NERO.',
};

export default function MyOrdersPage() {
    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-between">
            <div>
                <HeaderHome />
                <MyOrdersClient />
            </div>
            <FooterHome />
        </div>
    );
}
