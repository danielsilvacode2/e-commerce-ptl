
import React from 'react'
import { json } from 'stream/consumers'
import ApiUrlBase from '../api'

interface User {
    role: string,
    token: string
}

export default async function LoginService(email: string, password: string): Promise<string> {

    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    if (!res.ok) {
        throw new Error("Login failed");
    }

    const data = await res.json();
    const userRole = data["Body:"].user_role;
    const userToken = data["Body:"].token;

    const user: User = {
        role: userRole,
        token: userToken
    }

    localStorage.setItem('user', JSON.stringify(user))

    return userRole

}