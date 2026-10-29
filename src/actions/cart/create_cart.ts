import ApiUrlBase from "../api";


interface cartRequest {
    product_id: string,
    quantity: number
}

export default async function CreateCart ({product_id, quantity}:cartRequest) {

    const urlBase = ApiUrlBase()

    const res = await fetch(`${urlBase}/cart`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            product_id,
            quantity
        }),
    })

    if(!res.ok){
        throw new Error("Erro ao adicionar produto no carrinho")
    }

}