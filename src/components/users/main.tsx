'use client'

import { useEffect, useState } from 'react'
import { Pencil, UserRound } from 'lucide-react'
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
        user: 'Usuário',
    }
    return map[role?.toLowerCase()] ?? role
}

export default function MainUsers() {
    const [users, setUsers] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [editingUser, setEditingUser] = useState<UserResponse | null>(null)

    useEffect(() => {
        ReadAll()
            .then((data) => setUsers(data ?? []))
            .catch(() => setError("Erro ao carregar usuários."))
            .finally(() => setLoading(false))
    }, [])

    function handleEdit(user: UserResponse) {
        setEditingUser(user)
        // TODO: abrir modal de edição de usuário
    }

    return (
        <main className="min-h-screen w-full bg-[#121212] font-inter text-[#eaeaea] px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-5xl">

                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-[#333] pb-4">
                    <div className="min-w-0">
                        <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wide text-[#eaeaea] sm:text-3xl">
                            Usuários
                        </h1>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-400 sm:text-xs">
                            Gerencie os usuários cadastrados.
                        </p>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-widest text-[#ff6a00] sm:text-xs">
                        {users.length} {users.length === 1 ? "usuário" : "usuários"}
                    </span>
                </header>

                {/* Estados */}
                {loading && (
                    <p className="mt-8 text-xs uppercase tracking-widest text-neutral-400">
                        Carregando...
                    </p>
                )}

                {error && (
                    <span role="alert" className="mt-8 block text-[11px] uppercase tracking-wider text-red-500">
                        {error}
                    </span>
                )}

                {!loading && !error && users.length === 0 && (
                    <p className="mt-8 text-xs uppercase tracking-widest text-neutral-500">
                        Nenhum usuário encontrado.
                    </p>
                )}

                {/* Lista */}
                {!loading && !error && users.length > 0 && (
                    <ul className="mt-6 flex flex-col gap-3">
                        {users.map((user) => (
                            <li
                                key={user.Id}
                                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 border border-[#333] bg-[#1c1c1c] p-3 transition hover:border-[#ff6a00] sm:flex sm:gap-4"
                            >
                                {/* Avatar */}
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-[#333] bg-[#161616] sm:h-16 sm:w-16">
                                    <UserRound size={22} className="text-neutral-600" />
                                </div>

                                {/* Nome + E-mail */}
                                <div className="min-w-0 sm:flex-1">
                                    <p className="line-clamp-2 break-words text-sm font-medium uppercase tracking-wide text-[#eaeaea] sm:truncate">
                                        {user.name}
                                    </p>
                                    <p className="mt-1 truncate text-[11px] tracking-wider text-neutral-500">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Datas */}
                                <div className="col-span-2 min-w-0 border-t border-[#333] pt-3 text-[11px] uppercase tracking-widest text-neutral-500 sm:col-span-1 sm:w-56 sm:shrink-0 sm:border-0 sm:pt-0">
                                    <p className="truncate">
                                        Criado em: <span className="text-neutral-400">{formatDate(user.created_at)}</span>
                                    </p>
                                    <p className="mt-1 truncate">
                                        Atualizado em: <span className="text-neutral-400">{formatDate(user.update_at)}</span>
                                    </p>
                                </div>

                                {/* Função + Ação */}
                                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:contents">
                                    <span className="shrink-0 border border-[#ff6a00] px-2 py-1 text-[11px] font-medium uppercase tracking-widest text-[#ff6a00]">
                                        {formatRole(user.role)}
                                    </span>

                                    <div className="flex shrink-0 items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(user)}
                                            aria-label={`Editar ${user.name}`}
                                            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-[#ff6a00] hover:text-[#ff6a00] sm:h-9 sm:w-9"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}