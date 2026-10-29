import ApiUrlBase from "../api"

interface productUpdateRequest {
    Id: string
    name: string
    image: string
    description: string
    price: number
    quantity: number
    sku: string
}

export default async function UpdateProductById({
    Id,
    name,
    sku,
    description,
    price,
    image,
    quantity,
}: productUpdateRequest) {
    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/products/${Id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            sku,
            description,
            price,
            image,
            quantity,
        }),
    })

    if (!res.ok) {

        if (res.status == 409) {
            throw new Error("409")
        }
    }

    // Retorna o produto atualizado se a API devolver JSON (204 / corpo vazio => null)
    const body = await res.text()
    return body ? JSON.parse(body) : null
}