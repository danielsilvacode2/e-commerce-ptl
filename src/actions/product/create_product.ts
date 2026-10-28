

import React from 'react'
import { json } from 'stream/consumers'
import ApiUrlBase from '../api'


export type ProductCreateRequest = {
    name: string
    sku: string
    description: string
    price: number     // float64
    quantity: number  // int64
    image: string
}

export default async function ProductCreateService(data: ProductCreateRequest) {

    const user = JSON.parse(localStorage.getItem("user") || "{}")

    const baseUrl = ApiUrlBase()

    const res = await fetch(`${baseUrl}/products`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(data),
    })

    if (res.status === 409) throw new Error("CONFLICT")
    if (!res.ok) throw new Error("REQUEST_FAILED")


}
