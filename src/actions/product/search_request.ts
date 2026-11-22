import ApiUrlBase from '../api'
import { PaginatedProductsResponse } from './read_all_request'

// Servico de busca de produtos: GET /products/search?q=<termo>&page=&limit=
export default async function ProductSearchService(
    query: string,
    page: number = 1,
    limit: number = 5,
    signal?: AbortSignal,
): Promise<PaginatedProductsResponse> {
    const baseUrl = ApiUrlBase()
    const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) })

    const res = await fetch(`${baseUrl}/products/search?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
        signal,
    })

    if (!res.ok) {
        throw new Error(`Erro ao pesquisar produtos: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const body = json["Body:"] || {}

    return {
        data: Array.isArray(body.data) ? body.data : (Array.isArray(body.products) ? body.products : []),
        page: body.page || page,
        limit: body.limit || limit,
        total_rows: body.total_rows || 0,
        total_pages: body.total_pages || 1,
    }
}
