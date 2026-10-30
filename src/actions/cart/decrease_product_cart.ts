import ApiUrlBase from "../api"


interface DecreaseProductCartProps {
    id: string
    quantity: number
}

export default async function DecreaseProductCart({ id, quantity }: DecreaseProductCartProps) {

    const urlBase = ApiUrlBase()

    const res = await fetch(`${urlBase}/cart/decrease/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            quantity
        }),
    })

    if (!res.ok) {

        if (res.status === 422) {
            return
        }

        throw new Error("Erro ao atualizar is select do produto no carrinho")
    }

}