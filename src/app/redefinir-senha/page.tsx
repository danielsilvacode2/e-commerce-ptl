import type { Metadata } from 'next'
import ResetPasswordForm from './_components/reset-password-form'

export const metadata: Metadata = {
    title: 'Redefinir Senha | Nero Brasil',
    description: 'Defina uma nova senha para sua conta na Nero Brasil.',
}

export default function ResetPasswordPage() {
    return <ResetPasswordForm />
}
