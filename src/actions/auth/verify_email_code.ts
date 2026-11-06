


import React from 'react'
import { json } from 'stream/consumers'
import ApiUrlBase from '../api'
import { useSearchParams } from 'next/dist/client/components/navigation'

interface VerifyEmailCodeRequest {
    email: string,
    code: string
}

export default async function VerifyEmailCodeService(email: string, code: string) {

    const baseUrl = ApiUrlBase()

    /* const searchParams = useSearchParams();
     const email = searchParams.get('email'); */

    const res = await fetch(`${baseUrl}/users/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            verification_code: code
        })
    })

    if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After")
        throw new Error(retryAfter ? `429:${retryAfter}` : "429")
    }


    if (!res.ok) {
        throw new Error("401");
    }

}