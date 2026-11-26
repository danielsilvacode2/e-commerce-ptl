import ApiUrlBase from "../api"



interface DeleteProductByIdProps{
    Id: string
}

export default async function DeleteProductById({Id}: DeleteProductByIdProps) {

    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/products/${Id}`, {
        method: "DELETE",
        credentials: "include",
    })

    if (!res.ok){
        throw new Error("Erro ao deletar produto")
    }
    
}