'use client';
import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react"

import ProductCreateService, {
    type ProductCreateRequest,
} from "@/src/actions/product/create_product";
import { uploadToImgBB } from "@/src/actions/imageUp/uploadImage";

type Field = "name" | "sku" | "description" | "price" | "quantity" | "image"
type TextField = Exclude<Field, "image">
type Errors = Partial<Record<Field, string>>

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

/* ---------- Validações (alinhadas aos tipos da struct Go) ---------- */
const validators: Record<TextField, (v: string) => string> = {
    name: (v) => {
        const t = v.trim()
        if (!t) return "Name is required."
        if (t.length < 2) return "Name must be at least 2 characters."
        return ""
    },
    sku: (v) => {
        const t = v.trim()
        if (!t) return "SKU is required."
        if (!/^[A-Za-z0-9._-]+$/.test(t)) return "Use only letters, numbers, dots, dashes or underscores."
        return ""
    },
    description: (v) => {
        const t = v.trim()
        if (!t) return "Description is required."
        if (t.length < 10) return "Description must be at least 10 characters."
        return ""
    },
    price: (v) => {
        const n = parsePrice(v)
        if (!v.trim()) return "Price is required."
        if (Number.isNaN(n)) return "Enter a valid price, e.g. 49.90."
        if (n <= 0) return "Price must be greater than zero."
        return ""
    },
    quantity: (v) => {
        if (!v.trim()) return "Quantity is required."
        if (!/^\d+$/.test(v.trim())) return "Quantity must be a whole number."
        return ""
    },
}

function validateImage(file: File | null): string {
    if (!file) return "Image is required."
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG, WEBP or GIF image."
    if (file.size > MAX_IMAGE_SIZE) return "Image must be 5 MB or smaller."
    return ""
}

// aceita "49,90" e "49.90"
function parsePrice(v: string): number {
    return Number(v.trim().replace(",", "."))
}

const emptyForm: Record<TextField, string> = {
    name: "", sku: "", description: "", price: "", quantity: "",
}

export default function RegisterPage() {
    const [form, setForm] = useState(emptyForm)
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState("")
    const [errors, setErrors] = useState<Errors>({})
    const [formError, setFormError] = useState("")
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [imageBroken, setImageBroken] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Gera (e libera) a URL temporária do preview
    useEffect(() => {
        if (!file) {
            setPreviewUrl("")
            return
        }
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    function update(field: TextField, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
        setSuccess(false)
    }

    function blur(field: TextField) {
        setErrors((prev) => ({ ...prev, [field]: validators[field](form[field]) }))
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0] ?? null
        setFile(selected)
        setImageBroken(false)
        setErrors((prev) => ({ ...prev, image: selected ? validateImage(selected) : "" }))
        setSuccess(false)
    }

    async function onSubmit() {
        const fields = Object.keys(validators) as TextField[]
        const next: Errors = {}
        fields.forEach((f) => { next[f] = validators[f](form[f]) })
        next.image = validateImage(file)
        setErrors(next)
        setFormError("")
        setSuccess(false)
        if (Object.values(next).some(Boolean)) return
        if (!file) return // garante o tipo File (não-nulo) para o TypeScript

        setLoading(true)

        try {
            // 1) Upload da imagem -> retorna a URL (string)
            const imageUrl = await uploadToImgBB(file)

            // 2) Monta o payload com a URL
            const payload: ProductCreateRequest = {
                name: form.name.trim(),
                sku: form.sku.trim(),
                description: form.description.trim(),
                price: parsePrice(form.price),
                quantity: parseInt(form.quantity, 10),
                image: imageUrl,
            }

            // 3) Cria o produto
            await ProductCreateService(payload)

            setSuccess(true)
            setForm(emptyForm)
            setFile(null)
            setImageBroken(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        } catch (err) {
            if (err instanceof Error && err.message === "CONFLICT") {
                setErrors((prev) => ({ ...prev, sku: "This SKU is already registered." }))
            } else {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
                setFormError(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }

    const inputBase =
        "w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4"
    const inputOk = "border-slate-300 focus:border-blue-700 focus:ring-blue-700/15"
    const inputInvalid = "border-red-500 focus:border-red-500 focus:ring-red-500/15"
    const cls = (f: Field, extra = "h-11") =>
        `${inputBase} ${extra} ${errors[f] ? inputInvalid : inputOk}`

    const showPreview = !!previewUrl && !errors.image && !imageBroken

    function ErrorMsg({ field }: { field: Field }) {
        return errors[field] ? (
            <span id={`${field}-error`} role="alert" className="text-xs  text-red-600">
                {errors[field]}
            </span>
        ) : null
    }

    function Label({ field, children }: { field: Field; children: React.ReactNode }) {
        return (
            <label htmlFor={field} className="text-sm font-medium text-slate-700">
                {children}
            </label>
        )
    }

    const aria = (f: Field) => ({
        "aria-invalid": !!errors[f],
        "aria-describedby": errors[f] ? `${f}-error` : undefined,
    })

    return (
        <main className="min-h-screen w-full grid flex items-center justify-center bg-white font-inter">
            {/* Formulário */}
            <section className="flex items-center justify-center px-5 sm:px-8 py-10 sm:py-12">
                <div className="w-full max-w-[460px]">
                    <img
                        className=" w-[150px] sm:w-[170px] mb-8 sm:mb-10"
                        src="/assests/logo-ocean-azul-escuro.png"
                        alt="Ocean"
                    />

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                        Register product
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Fill in the product details to add it to your store.
                    </p>

                    {success && (
                        <div
                            role="status"
                            className="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800"
                        >
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                            Product registered successfully.
                        </div>
                    )}

                    <form
                        className="mt-5 flex flex-col gap-5"
                        noValidate
                        onSubmit={(e) => { e.preventDefault(); onSubmit() }}
                    >
                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <Label field="name">Name</Label>
                            <input
                                id="name" type="text" placeholder="Product name"
                                autoComplete="off" className={cls("name")}
                                value={form.name} {...aria("name")}
                                onChange={(e) => update("name", e.target.value)}
                                onBlur={() => blur("name")}
                            />
                            <ErrorMsg field="name" />
                        </div>

                        {/* SKU / Price / Quantity */}
                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5 sm:col-span-1">
                                <Label field="sku">SKU</Label>
                                <input
                                    id="sku" type="text" placeholder="TEE-BLK-M"
                                    autoComplete="off" className={cls("sku")}
                                    value={form.sku} {...aria("sku")}
                                    onChange={(e) => update("sku", e.target.value)}
                                    onBlur={() => blur("sku")}
                                />
                                <ErrorMsg field="sku" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label field="price">Price</Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">
                                        $
                                    </span>
                                    <input
                                        id="price" type="text" inputMode="decimal" placeholder="0.00"
                                        autoComplete="off" className={`${cls("price")} pl-7`}
                                        value={form.price} {...aria("price")}
                                        onChange={(e) => update("price", e.target.value)}
                                        onBlur={() => blur("price")}
                                    />
                                </div>
                                <ErrorMsg field="price" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label field="quantity">Quantity</Label>
                                <input
                                    id="quantity" type="text" inputMode="numeric" placeholder="0"
                                    autoComplete="off" className={cls("quantity")}
                                    value={form.quantity} {...aria("quantity")}
                                    onChange={(e) => update("quantity", e.target.value)}
                                    onBlur={() => blur("quantity")}
                                />
                                <ErrorMsg field="quantity" />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <Label field="description">Description</Label>
                            <textarea
                                id="description" rows={4}
                                placeholder="Materials, size, what makes it special..."
                                className={`${cls("description", "py-2.5")} resize-y`}
                                value={form.description} {...aria("description")}
                                onChange={(e) => update("description", e.target.value)}
                                onBlur={() => blur("description")}
                            />
                            <ErrorMsg field="description" />
                        </div>

                        {/* Image */}
                        <div className="flex flex-col gap-1.5">
                            <Label field="image">Image</Label>
                            <input
                                ref={fileInputRef}
                                id="image" type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                className={`${cls("image", "h-11 py-2")} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200`}
                                {...aria("image")}
                                onChange={onFileChange}
                            />
                            <ErrorMsg field="image" />
                            {showPreview && (
                                <img
                                    src={previewUrl}
                                    alt="Product preview"
                                    onError={() => setImageBroken(true)}
                                    className="mt-1 h-32 w-32 rounded-lg border border-slate-200 object-cover"
                                />
                            )}
                            {imageBroken && (
                                <span className="text-xs text-slate-500">
                                    Could not load a preview for this file.
                                </span>
                            )}
                        </div>

                        {formError && (
                            <span role="alert" className="text-xs text-red-600">{formError}</span>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-11 rounded-lg bg-blue-900 text-sm font-medium text-white transition hover:bg-blue-800 active:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-700/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving..." : "Register product"}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}