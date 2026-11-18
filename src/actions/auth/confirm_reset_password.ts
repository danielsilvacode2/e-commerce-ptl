import ApiUrlBase from "../api"

export interface ConfirmResetPasswordRequest {
    email: string
    code: string
    newpass: string
}

export interface ConfirmResetPasswordResponse {
    Response: {
        status: number
        mensagem: string
    }
}

export default async function ConfirmResetPasswordService(
    email: string,
    code: string,
    newpass: string
): Promise<ConfirmResetPasswordResponse> {
    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/users/confirm-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
            newpass,
        }),
    })

    if (res.status === 429) {
        throw new Error("RATE_LIMIT")
    }

    if (res.status === 401) {
        throw new Error("INVALID_OR_EXPIRED_CODE")
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

    return (await res.json()) as ConfirmResetPasswordResponse
}
