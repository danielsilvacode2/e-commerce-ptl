
import React from 'react'
import { json } from 'stream/consumers'
import ApiUrlBase from '../api'

interface User {
    role: string,
    token: string
}

export default async function LoginService(email: string, password: string) {

    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    if (!res.ok) {
        throw new Error("401");
    }

}