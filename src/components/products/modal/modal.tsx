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
    'w-full border border-[#333] bg-[#161616] px-3 py-2 text-sm text-[#eaeaea] outline-none transition placeholder:text-neutral-600 focus:border-[#ff6a00]'
const labelClass = 'mb-1 block text-[11px] uppercase tracking-widest text-neutral-400'

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

    // Fecha com ESC
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

            // Agora envia os valores editados (data), não os antigos de product
            const updated = await UpdateProductById({
                Id: product.id,
                ...data,
            })

            // Se a API não devolver o produto, mescla com o que foi enviado
            onSaved({ ...product, ...data, ...(updated ?? {}) } as ProductResponse)
            onClose()
        } catch (err) {
            console.error(err)

            if (err instanceof Error && err.message === "409") {
                setConflitErr("Esse produto ja esta cadastrado")
            } else {
                setError(err instanceof Error ? err.message : 'Erro ao atualizar produto.')
            }




        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => !saving && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Editar produto"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-[#ff6a00] bg-[#1c1c1c] shadow-lg"
            >
                <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
                    <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-xl font-bold uppercase tracking-wide">
                        Editar produto
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Fechar"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-red-500 hover:text-red-500 disabled:opacity-40"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
                    <div>
                        <label htmlFor="name" className={labelClass}>Nome</label>
                        <input id="name" name="name" value={form.name} onChange={handleChange} className={inputClass} />
                    </div>

                    <div>
                        <label htmlFor="sku" className={labelClass}>SKU</label>
                        <input id="sku" name="sku" value={form.sku} onChange={handleChange} className={inputClass} />
                    </div>
                    {errConflit && (
                        <span role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                            {errConflit}
                        </span>
                    )}

                    <div>
                        <label htmlFor="description" className={labelClass}>Descrição</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={handleChange}
                            className={inputClass + ' resize-none'}
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
                        <span role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                            {error}
                        </span>
                    )}

                    <div className="mt-1 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="cursor-pointer border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-neutral-400 transition hover:border-neutral-400 disabled:opacity-40"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="cursor-pointer border border-[#ff6a00] bg-[#ff6a00] px-4 py-2 text-xs font-medium uppercase tracking-widest text-[#121212] transition hover:bg-transparent hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}