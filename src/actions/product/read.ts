import ApiUrlBase from '../api'

// 1. Tipagem do produto individual
export type ProductResponse = {
    id: string
    name: string
    sku: string
    description: string
    price: number
    quantity: number
    image: string
    update_at: string
    created_at: string
}


export default async function ProductReadService(id: string): Promise<ProductResponse> {
    const baseUrl = ApiUrlBase()

    // Passando os parâmetros page e limit na query string da URL
    const res = await fetch(`${baseUrl}/products/${id}`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar produtos: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()


    const body = json["Body:"] || null

    return body
}