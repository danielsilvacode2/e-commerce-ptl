'use client';

import MainProducts from "@/src/components/products/main";
import NavProducts from "@/src/components/products/nav/nav";
import ReadMe, { UserResponse } from "@/src/actions/me/readMe";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'

export default function ProductsPage() {

    const router = useRouter()
    const [display, setDisplay] = useState<string>("hidden")

    
    useEffect(() => {
        ReadMe()
            .then((dataUser) => {
                if (dataUser?.role != "admin") {
                    router.push("/")
                }else{
                    setDisplay("")
                }
            })
            .catch(() =>{
                router.push("/")
            })
    }, [])


    return (
        <div className={ `${display} min-h-screen w-full flex flex-col md:flex-row bg-[#121212] font-inter text-[#eaeaea]`}>

            <NavProducts active="list" />
            <MainProducts />

        </div>
    );
}