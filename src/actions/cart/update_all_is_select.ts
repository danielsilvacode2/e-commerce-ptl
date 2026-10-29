import ApiUrlBase from "../api"


interface updateIsSelectProps {
    select: boolean
}

export default async function UpdateAllIsSelectCart({ select }: updateIsSelectProps) {

    const urlBase = ApiUrlBase()

    const res = await fetch(`${urlBase}/cart`, {
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
        throw new Error("Erro ao atualizar all is select do produto no carrinho")
    }

}