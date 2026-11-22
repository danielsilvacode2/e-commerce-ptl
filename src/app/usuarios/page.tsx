'use client';

import NavProducts from "@/src/components/products/nav/nav"
import MainUsers from "@/src/components/users/main"
import ReadMe from "@/src/actions/me/readMe";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'

export default function PageAllUsers() {
    const router = useRouter()
    const [display, setDisplay] = useState<string>("hidden")

    useEffect(() => {
        ReadMe()
            .then((dataUser) => {
                if (dataUser?.role !== "admin") {
                    router.push("/")
                } else {
                    setDisplay("")
                }
            })
            .catch(() => {
                router.push("/")
            })
    }, [router])

    return (
        <div className={`${display} min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#121212] font-sans text-black dark:text-white transition-colors`}>
            <NavProducts active="listusers" />
            <MainUsers />
        </div>
    )
}
