
import React from 'react'
import { json } from 'stream/consumers'

interface User {
    role: string,
    token: string
}

export default async function LoginService(email: string, password: string): Promise<string> {



    const res = await fetch("http://localhost:5000/api/v1/login", {
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