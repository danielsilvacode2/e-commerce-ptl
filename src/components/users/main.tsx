'use client'

import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import ReadAll, { UserResponse } from '@/src/actions/usuarios/read_all'

const formatDate = (value: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    })
}

const formatRole = (role: string) => {
    const map: Record<string, string> = {
        admin: 'Administrador',
        user: 'Cliente',
    }
    return map[role?.toLowerCase()] ?? role
}

export default function MainUsers() {
    const [users, setUsers] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        ReadAll()
            .then((data) => setUsers(data ?? []))
            .catch(() => setError("Erro ao carregar usuários."))
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="min-h-screen flex-1 bg-white dark:bg-[#121212] px-6 py-8 font-sans text-black dark:text-white transition-colors">
            <div className="mx-auto w-full max-w-5xl">
                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black dark:text-white">
                            USUÁRIOS CADASTRADOS
                        </h1>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                            Gerencie os clientes e administradores da plataforma.
                        </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {users.length} {users.length === 1 ? "usuário" : "usuários"}
                    </span>
                </header>

                {/* Estados */}
                {loading && (
                    <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Carregando usuários...
                    </p>
                )}

                {error && (
                    <div role="alert" className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                {!loading && !error && users.length === 0 && (
                    <div className="mt-8 rounded-3xl bg-[#F2F0F1] dark:bg-[#181818] p-12 text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-black dark:text-white">
                            Nenhum usuário cadastrado.
                        </p>
                    </div>
                )}

                {/* Lista */}
                {!loading && !error && users.length > 0 && (
                    <ul className="mt-6 flex flex-col gap-3">
                        {users.map((user) => (
                            <li
                                key={user.Id}
                                className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-4 transition-all hover:border-black/30 dark:hover:border-white/30 hover:shadow-sm sm:flex sm:items-center sm:gap-4"
                            >
                                {/* Avatar em pílula #F2F0F1 */}
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F2F0F1] dark:bg-[#222222] text-black dark:text-white">
                                    <UserRound size={22} />
                                </div>

                                {/* Nome + E-mail */}
                                <div className="min-w-0 sm:flex-1 mt-2 sm:mt-0">
                                    <p className="font-display font-bold text-base text-black dark:text-white uppercase tracking-tight truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Datas */}
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-sans sm:text-right mt-2 sm:mt-0">
                                    <p>Cadastrado em: <strong className="text-black dark:text-white">{formatDate(user.created_at)}</strong></p>
                                </div>

                                {/* Função */}
                                <div className="mt-2 sm:mt-0">
                                    <span className="rounded-full bg-[#F2F0F1] dark:bg-[#222222] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                        {formatRole(user.role)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}
