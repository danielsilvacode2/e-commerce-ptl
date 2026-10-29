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

// 2. Nova tipagem que espelha o dto.PaginatedProducts do backend
export type PaginatedProductsResponse = {
    data: ProductResponse[]
    page: number
    limit: number
    total_rows: number
    total_pages: number
}

// 3. Atualizar a função para aceitar page e limit, e retornar a estrutura paginada
export default async function ProductReadAllService(page: number = 1, limit: number = 5): Promise<PaginatedProductsResponse> {
    const baseUrl = ApiUrlBase()

    // Passando os parâmetros page e limit na query string da URL
    const res = await fetch(`${baseUrl}/products?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store", 
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar produtos: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()

    // O helper de resposta do seu backend costuma colocar o corpo dentro de "Body:"
    // Aqui pegamos o objeto paginado que veio de lá
    const body = json["Body:"] || {}

    return {
        data: Array.isArray(body.products) ? body.products : (Array.isArray(body.data) ? body.data : []),
        page: body.page || page,
        limit: body.limit || limit,
        total_rows: body.total_rows || 0,
        total_pages: body.total_pages || 1,
    }
}