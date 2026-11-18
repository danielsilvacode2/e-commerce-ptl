import type { Metadata } from 'next'
import ForgotPasswordForm from './_components/forgot-password-form'

export const metadata: Metadata = {
    title: 'Recuperar Senha | Nero Brasil',
    description: 'Solicite a recuperação de senha da sua conta na Nero Brasil.',
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}
