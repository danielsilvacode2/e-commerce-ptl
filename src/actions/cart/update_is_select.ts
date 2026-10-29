import ApiUrlBase from "../api"


interface updateIsSelectProps {
    id: string
    select: boolean
}

export default async function UpdateIsSelectCart({ id, select }: updateIsSelectProps) {

    const urlBase = ApiUrlBase()

    const res = await fetch(`${urlBase}/cart/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            select
        }),
    })

    if (!res.ok) {
        throw new Error("Erro ao atualizar is select do produto no carrinho")
    }

}