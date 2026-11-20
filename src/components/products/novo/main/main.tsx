'use client';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

import ProductCreateService, { type ProductCreateRequest } from "@/src/actions/product/create_product";
import { uploadToImgBB } from "@/src/actions/imageUp/uploadImage";

type TextField = "name" | "sku" | "description" | "price" | "quantity";
type Field = TextField | "image";
type Errors = Partial<Record<Field, string>>;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const emptyForm: Record<TextField, string> = { name: "", sku: "", description: "", price: "", quantity: "" };

const parsePrice = (v: string) => Number(v.trim().replace(",", "."));

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

function FormField({ id, label, error, children }: { id: Field; label: string; error?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs uppercase tracking-wider text-black font-bold">{label}</label>
            {children}
            {error && <span id={`${id}-error`} role="alert" className="text-xs text-red-600 font-medium px-3">{error}</span>}
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

    const inputCls = (f: Field, extra = "h-12") =>
        `w-full rounded-full border bg-[#F2F0F1] px-5 text-sm text-black placeholder:text-neutral-500 outline-none transition font-sans ${extra} ${
            errors[f] ? "border-red-500 bg-red-50 focus:border-red-500" : "border-transparent focus:border-black/20 focus:bg-white"
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
        <main className="flex-1 flex items-start justify-center px-6 py-10 md:py-14 font-sans text-black">
            <div className="w-full max-w-[500px]">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
                    CADASTRAR NOVO PRODUTO
                </h2>
                <p className="mt-2 text-sm text-neutral-600 font-sans">
                    Preencha os dados do item para adicioná-lo ao catálogo da loja.
                </p>

                {success && (
                    <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-700">
                        <CheckCircle2 size={18} className="shrink-0" />
                        Produto cadastrado com sucesso e adicionado ao catálogo!
                    </div>
                )}

                <form className="mt-8 flex flex-col gap-5" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                    <FormField id="name" label="Nome do Produto" error={errors.name}>
                        <input type="text" placeholder="Ex: Camiseta Streetwear Minimalista" className={inputCls("name")} {...bind("name")} />
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <FormField id="sku" label="SKU" error={errors.sku}>
                            <input type="text" placeholder="TEE-BLK-M" className={inputCls("sku")} {...bind("sku")} />
                        </FormField>

                        <FormField id="price" label="Preço (R$)" error={errors.price}>
                            <input type="text" inputMode="decimal" placeholder="180.00" className={inputCls("price")} {...bind("price")} />
                        </FormField>

                        <FormField id="quantity" label="Qtd. Estoque" error={errors.quantity}>
                            <input type="text" inputMode="numeric" placeholder="50" className={inputCls("quantity")} {...bind("quantity")} />
                        </FormField>
                    </div>

                    <FormField id="description" label="Descrição" error={errors.description}>
                        <textarea
                            rows={4}
                            placeholder="Descreva detalhes como corte, caimento, composição de algodão..."
                            className="w-full rounded-2xl border border-transparent bg-[#F2F0F1] p-4 text-sm text-black placeholder:text-neutral-500 outline-none focus:border-black/20 focus:bg-white resize-y"
                            {...bind("description")}
                        />
                    </FormField>

                    <FormField id="image" label="Imagem do Produto" error={errors.image}>
                        <input
                            ref={fileInputRef}
                            id="image"
                            type="file"
                            accept={IMAGE_TYPES.join(",")}
                            aria-invalid={!!errors.image}
                            aria-describedby={errors.image ? "image-error" : undefined}
                            className="w-full text-xs text-neutral-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-neutral-800 cursor-pointer"
                            onChange={onFileChange}
                        />
                        {showPreview && (
                            <div className="mt-2 h-36 w-36 rounded-2xl bg-[#F2F0F1] p-2 overflow-hidden flex items-center justify-center">
                                <img
                                    src={previewUrl}
                                    alt="Pré-visualização"
                                    onError={() => setImageBroken(true)}
                                    className="h-full w-full object-contain mix-blend-multiply"
                                />
                            </div>
                        )}
                        {imageBroken && <span className="text-xs text-red-600">Não foi possível carregar a pré-visualização.</span>}
                    </FormField>

                    {formError && (
                        <div role="alert" className="p-3 rounded-2xl bg-red-50 text-xs text-red-600 font-medium">
                            {formError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 h-12 rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                        {loading ? "Gravando produto..." : "Cadastrar Produto"} <ArrowRight size={16} />
                    </button>
                </form>
            </div>
        </main>
    );
}
