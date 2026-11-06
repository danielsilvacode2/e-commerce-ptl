import React from 'react'
import { json } from 'stream/consumers'
import ApiUrlBase from '../api'

interface User {
    role: string,
    token: string
}



export default async function SignService(email: string, password: string, name: string) {
    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
    })

    if (res.status === 429) throw new Error("RATE_LIMIT")
    if (res.status === 400 || res.status === 422) throw new Error("INVALID_DATA")
    if (!res.ok) throw new Error("UNKNOWN")

    // 202 (ou 2xx): sucesso, sem revelar se o email já existia
}