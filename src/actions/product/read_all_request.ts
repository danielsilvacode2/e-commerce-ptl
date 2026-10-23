import ApiUrlBase from '../api'

// Espelha o ProcuctResponseDTO do backend (Go)
export type ProductResponse = {
    id: string          // uuid.UUID
    name: string
    sku: string
    description: string
    price: number       // float64
    quantity: number    // int64
    image: string
    update_at: string   // time.Time vem como string ISO 8601
    created_at: string  // time.Time vem como string ISO 8601
}

export default async function ProductReadAllService(): Promise<ProductResponse[]> {
    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/products`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store", // opcional: evita cache no Next.js
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar produtos: ${res.status} ${res.statusText}`)
    }

    const data: ProductResponse[] = await res.json()

    return data ?? [] // Go retorna `null` para slice nil
}