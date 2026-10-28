import ApiUrlBase from "../api"



export type UserResponse = {
    Id: string,
    name: string,
    email: string,
    role: string,
    update_at: string,
    created_at: string
}
export default async function ReadMe(): Promise<UserResponse | null> {

    const baseUrl = ApiUrlBase()  
    const res = await fetch(`${baseUrl}/users/me`, {
        method: "GET",
        credentials: "include",
    })
   
    if (res.status === 401) return null
    if (!res.ok) throw new Error(`Erro ${res.status} em ${res.url}`)

    const data = await res.json()
    return data["Body:"] as UserResponse
}