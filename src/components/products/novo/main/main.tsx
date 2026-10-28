'use client';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import ProductCreateService, { type ProductCreateRequest } from "@/src/actions/product/create_product";
import { uploadToImgBB } from "@/src/actions/imageUp/uploadImage";

type TextField = "name" | "sku" | "description" | "price" | "quantity";
type Field = TextField | "image";
type Errors = Partial<Record<Field, string>>;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const emptyForm: Record<TextField, string> = { name: "", sku: "", description: "", price: "", quantity: "" };

const parsePrice = (v: string) => Number(v.trim().replace(",", "."));

/* ---------- Validações ---------- */
const validators: Record<TextField, (v: string) => string> = {
    name: (v) => (v.trim().length < 2 ? "O nome deve ter pelo menos 2 caracteres." : ""),
    sku: (v) => (/^[\w.-]+$/.test(v.trim()) ? "" : "SKU obrigatório"),
    description: (v) => (v.trim().length < 10 ? "A descrição deve ter pelo menos 10 caracteres." : ""),
    price: (v) => (parsePrice(v) > 0 ? "" : "Insira um preço válido maior que zero"),
    quantity: (v) => (/^\d+$/.test(v.trim()) ? "" : "A quantidade deve ser um número inteiro."),
};

const validateImage = (f: File | null) =>
    !f ? "A imagem é obrigatória."
    : !IMAGE_TYPES.includes(f.type) ? "Use uma imagem JPG, PNG, WEBP ou GIF."
    : f.size > MAX_IMAGE_SIZE ? "A imagem deve ter no máximo 5 MB."
    : "";

/* ---------- Componentes ---------- */
const errorCls = "text-[11px] uppercase tracking-wider text-red-500";

function FormField({ id, label, error, children }: { id: Field; label: string; error?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs uppercase tracking-widest text-neutral-300 font-medium">{label}</label>
            {children}
            {error && <span id={`${id}-error`} role="alert" className={errorCls}>{error}</span>}
        </div>
    );
}

export default function MainNovoProducts() {
    const [form, setForm] = useState(emptyForm);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageBroken, setImageBroken] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!file) return setPreviewUrl("");
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const setError = (f: Field, msg: string) => setErrors((p) => ({ ...p, [f]: msg }));

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0] ?? null;
        setFile(selected);
        setImageBroken(false);
        setSuccess(false);
        setError("image", selected ? validateImage(selected) : "");
    }

    async function onSubmit() {
        const next: Errors = { image: validateImage(file) };
        (Object.keys(validators) as TextField[]).forEach((f) => (next[f] = validators[f](form[f])));
        setErrors(next);
        setFormError("");
        setSuccess(false);
        if (Object.values(next).some(Boolean) || !file) return;

        setLoading(true);
        try {
            const payload: ProductCreateRequest = {
                name: form.name.trim(),
                sku: form.sku.trim(),
                description: form.description.trim(),
                price: parsePrice(form.price),
                quantity: parseInt(form.quantity, 10),
                image: await uploadToImgBB(file),
            };
            await ProductCreateService(payload);

            setSuccess(true);
            setForm(emptyForm);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            if (err instanceof Error && err.message === "CONFLICT") setError("sku", "Este SKU já está cadastrado.");
            else setFormError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setLoading(false);
        }
    }

  
    const inputCls = (f: Field, extra = "h-11") =>
        `w-full rounded-none border bg-[#1c1c1c] px-3.5 text-sm text-[#eaeaea] placeholder:text-neutral-500 outline-none transition font-inter focus:ring-1 ${extra} ${
            errors[f] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-[#333] focus:border-[#ff6a00] focus:ring-[#ff6a00]"
        }`;

    const bind = (f: TextField) => ({
        id: f,
        value: form[f],
        autoComplete: "off",
        "aria-invalid": !!errors[f],
        "aria-describedby": errors[f] ? `${f}-error` : undefined,
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm((p) => ({ ...p, [f]: e.target.value }));
            if (errors[f]) setError(f, "");
            setSuccess(false);
        },
        onBlur: () => setError(f, validators[f](form[f])),
    });

    const showPreview = previewUrl && !errors.image && !imageBroken;

    return (
        <main className="flex-1 flex items-start justify-center px-6 py-10 md:py-14">
            <div className="w-full max-w-[460px]">
                <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-3xl font-bold uppercase tracking-wide">
                    Cadastrar produto
                </h2>
                <p className="mt-1.5 text-xs text-neutral-400 uppercase tracking-wider">
                    Preencha os dados para adicionar o produto à loja.
                </p>

                {success && (
                    <div role="status" className="mt-5 flex items-start gap-2.5 border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-3 text-xs uppercase tracking-wider text-emerald-400">
                        <CheckCircle2 size={16} className="shrink-0" />
                        Produto cadastrado com sucesso.
                    </div>
                )}

                <form className="mt-6 flex flex-col gap-5" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                    <FormField id="name" label="Nome" error={errors.name}>
                        <input type="text" placeholder="Nome do produto" className={inputCls("name")} {...bind("name")} />
                    </FormField>

                    <div className="grid gap-5 sm:grid-cols-3">
                        <FormField id="sku" label="SKU" error={errors.sku}>
                            <input type="text" placeholder="TEE-BLK-M" className={inputCls("sku")} {...bind("sku")} />
                        </FormField>

                        <FormField id="price" label="Preço" error={errors.price}>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-neutral-500">$</span>
                                <input type="text" inputMode="decimal" placeholder="0.00" className={`${inputCls("price")} pl-7`} {...bind("price")} />
                            </div>
                        </FormField>

                        <FormField id="quantity" label="Qtd." error={errors.quantity}>
                            <input type="text" inputMode="numeric" placeholder="0" className={inputCls("quantity")} {...bind("quantity")} />
                        </FormField>
                    </div>

                    <FormField id="description" label="Descrição" error={errors.description}>
                        <textarea
                            rows={4}
                            placeholder="Materiais, tamanho, o que o torna especial..."
                            className={`${inputCls("description", "py-2.5")} resize-y`}
                            {...bind("description")}
                        />
                    </FormField>

                    <FormField id="image" label="Imagem" error={errors.image}>
                        <input
                            ref={fileInputRef}
                            id="image"
                            type="file"
                            accept={IMAGE_TYPES.join(",")}
                            aria-invalid={!!errors.image}
                            aria-describedby={errors.image ? "image-error" : undefined}
                            className={`${inputCls("image", "h-11 py-2")} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-none file:border-0 file:bg-[#333] file:px-3 file:py-1 file:text-xs file:uppercase file:tracking-wider file:text-[#eaeaea] hover:file:bg-[#444]`}
                            onChange={onFileChange}
                        />
                        {showPreview && (
                            <img
                                src={previewUrl}
                                alt="Pré-visualização do produto"
                                onError={() => setImageBroken(true)}
                                className="mt-1 h-32 w-32 border border-[#333] object-cover"
                            />
                        )}
                        {imageBroken && <span className={errorCls}>Não foi possível carregar a pré-visualização.</span>}
                    </FormField>

                    {formError && <span role="alert" className={errorCls}>{formError}</span>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 h-11 rounded-none bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] transition hover:brightness-110 active:brightness-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Salvando..." : "Cadastrar produto"}
                    </button>
                </form>
            </div>
        </main>
    );
}