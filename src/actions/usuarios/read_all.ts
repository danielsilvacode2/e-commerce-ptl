import ApiUrlBase from "../api";


export type UserResponse = {
    Id: string,
    name: string,
    email: string,
    role: string,
    update_at: string,
    created_at: string
}

export default async function ReadAll(): Promise<UserResponse[] | null> {

    const urlBase = ApiUrlBase()

    const res = await fetch(`${urlBase}/users`, {
        method: "GET",
        credentials: "include",
    })


    if (!res.ok) {
        throw new Error(`Erro ao buscar usuarios`)
    }

    const data = await res.json()

    return Array.isArray(data["Body:"]) ? data["Body:"] : []

}