import ApiUrlBase from "../api"

export interface ResetPasswordRequest {
    email: string
}

export interface ResetPasswordResponse {
    Response: {
        status: number
        mensagem: string
    }
}

export default async function ResetPasswordService(email: string): Promise<ResetPasswordResponse> {
    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
    })

    if (res.status === 429) {
        throw new Error("RATE_LIMIT")
    }

    if (res.status === 404) {
        throw new Error("USER_NOT_FOUND")
    }

    if (res.status === 400 || res.status === 422) {
        throw new Error("INVALID_INPUT")
    }

    if (!res.ok) {
        throw new Error("SERVER_ERROR")
    }

    return (await res.json()) as ResetPasswordResponse
}
