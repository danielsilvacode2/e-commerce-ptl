import ApiUrlBase from "../api";

export default async function RemoveProductCart(id: string) {

    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/cart/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    })

    if (res.status === 204) {
        throw new Error("204")
        return
    }

    if (!res.ok) {
        throw new Error("Erro ao deletar produto")
    }

}