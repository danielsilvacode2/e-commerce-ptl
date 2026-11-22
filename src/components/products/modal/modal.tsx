'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import UpdateProductById from '@/src/actions/product/update_products'

interface Props {
    product: ProductResponse
    onClose: () => void
    onSaved: (updated: ProductResponse) => void
}

const inputClass =
    'h-11 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#1f1f1f] px-4 text-xs font-sans text-black dark:text-white outline-none transition placeholder:text-neutral-400 focus:border-black dark:focus:border-white'
const labelClass = 'mb-1.5 block text-xs uppercase tracking-wider text-black dark:text-white font-bold'

export default function EditProductModal({ product, onClose, onSaved }: Props) {
    const [form, setForm] = useState({
        name: product.name ?? '',
        sku: product.sku ?? '',
        description: (product as any).description ?? '',
        price: String(product.price ?? ''),
        quantity: String((product as any).quantity ?? 0),
        image: product.image ?? '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [errConflit, setConflitErr] = useState<string>("")

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose, saving])

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setConflitErr('')

        const price = Number(form.price.replace(',', '.'))
        const quantity = parseInt(form.quantity, 10)

        if (!form.name.trim()) return setError('Informe o nome.')
        if (!form.sku.trim()) return setError('Informe o SKU.')
        if (Number.isNaN(price) || price < 0) return setError('Preço inválido.')
        if (Number.isNaN(quantity) || quantity < 0) return setError('Quantidade inválida.')

        const data = {
            name: form.name.trim(),
            sku: form.sku.trim(),
            description: form.description.trim(),
            price,
            quantity,
            image: form.image.trim(),
        }

        try {
            setSaving(true)
            const updated = await UpdateProductById({
                Id: product.id,
                ...data,
            })
            onSaved({ ...product, ...data, ...(updated ?? {}) } as ProductResponse)
            onClose()
        } catch (err) {
            console.error(err)
            if (err instanceof Error && err.message === "409") {
                setConflitErr("Esse produto já está cadastrado com este SKU.")
            } else {
                setError(err instanceof Error ? err.message : 'Erro ao atualizar produto.')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !saving && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Editar produto"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl text-black dark:text-white"
            >
                <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black dark:text-white">
                        Editar Produto
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="p-1 rounded-full hover:bg-[#F2F0F1] dark:hover:bg-[#252525] text-black dark:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <div>
                        <label htmlFor="name" className={labelClass}>Nome</label>
                        <input id="name" name="name" value={form.name} onChange={handleChange} className={inputClass} />
                    </div>

                    <div>
                        <label htmlFor="sku" className={labelClass}>SKU</label>
                        <input id="sku" name="sku" value={form.sku} onChange={handleChange} className={inputClass} />
                    </div>
                    {errConflit && (
                        <div role="alert" className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium">
                            {errConflit}
                        </div>
                    )}

                    <div>
                        <label htmlFor="description" className={labelClass}>Descrição</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-black/15 dark:border-white/20 bg-white dark:bg-[#1f1f1f] p-4 text-xs font-sans text-black dark:text-white outline-none transition placeholder:text-neutral-400 focus:border-black dark:focus:border-white resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="price" className={labelClass}>Preço (R$)</label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.price}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="quantity" className={labelClass}>Quantidade</label>
                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                step="1"
                                min="0"
                                value={form.quantity}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="image" className={labelClass}>URL da imagem</label>
                        <input
                            id="image"
                            name="image"
                            value={form.image}
                            onChange={handleChange}
                            placeholder="https://..."
                            className={inputClass}
                        />
                    </div>

                    {error && (
                        <div role="alert" className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-11 px-6 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
