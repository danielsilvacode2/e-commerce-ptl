import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import MyOrdersClient from '@/src/components/pedidos/main/main'
import ErrorBoundary from '@/src/components/ui/error-boundary'

export const metadata = {
  title: 'Meus Pedidos | NERO',
  description: 'Acompanhe todos os seus pedidos realizados na NERO.',
}

export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans flex flex-col justify-between transition-colors">
      <div>
        <HeaderHome />
        <ErrorBoundary scope="section" sectionName="seus pedidos">
          <MyOrdersClient />
        </ErrorBoundary>
      </div>
      <FooterHome />
    </div>
  )
}
