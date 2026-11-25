import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import MainAccount from '@/src/components/account/main'
import ErrorBoundary from '@/src/components/ui/error-boundary'

export const metadata = {
  title: 'Minha Conta | NERO',
  description: 'Gerencie seus dados, segurança e atendimento na NERO.',
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans flex flex-col justify-between transition-colors">
      <div>
        <HeaderHome />
        <ErrorBoundary scope="section" sectionName="sua conta">
          <MainAccount />
        </ErrorBoundary>
      </div>
      <FooterHome />
    </div>
  )
}
