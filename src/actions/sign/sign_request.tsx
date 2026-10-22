import React from 'react'
import { json } from 'stream/consumers'

interface User {
    role: string,
    token: string
}

export default async function SignService(email: string, password: string, name: string) {



    console.log(email, " " , password, " ", password)

    const res = await fetch("http://localhost:5000/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
        })
    })

    if (!res.ok) {
        throw new Error("Login failed");
    }

}