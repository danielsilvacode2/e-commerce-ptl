import VerifyEmailMain from '@/src/components/verify-email/main'

export const metadata = {
    title: 'Verificar E-mail | SHOP.CO',
    description: 'Confirme o código enviado para o seu endereço de e-mail.',
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <VerifyEmailMain />
        </div>
    )
}
