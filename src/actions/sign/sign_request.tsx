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
        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
        })
    })


    if (res.status === 409) {
        throw new Error("CONFLICT");
    }



}