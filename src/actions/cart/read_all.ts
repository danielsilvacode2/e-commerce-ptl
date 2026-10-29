import ApiUrlBase from "../api";

export interface ProductCartResponse {
    id: string;
    isSelect: boolean;
    quantity: number;
    product_id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    image: string;
}

export interface CartUserResponse {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface CartResponse {
    id: string;
    user: CartUserResponse;
    list: ProductCartResponse[];
}

interface CartApiEnvelope {
    "Body:"?: CartResponse; // a API está retornando a chave com ":" no final
    Body?: CartResponse;    // fallback caso você corrija no backend
    Response: {
        status: number;
        mensagem: string;
    };
}

export default async function ReadCart(): Promise<CartResponse> {
    const urlBase = ApiUrlBase();

    const res = await fetch(`${urlBase}/cart`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`Erro ao buscar produtos do carrinho`);
    }

    const json = (await res.json()) as CartApiEnvelope;
    const body = json["Body:"] ?? json.Body;

    if (!body) {
        throw new Error(json.Response?.mensagem ?? "Resposta inválida do carrinho");
    }

    return {
        ...body,
        list: body.list ?? [],
    };
}