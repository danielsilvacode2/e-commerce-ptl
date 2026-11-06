
import React from 'react'
import ApiUrlBase from '../api'

export default async function LogoutService() {

    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
        throw new Error("401");
    }

}