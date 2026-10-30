import HeaderHome from "@/src/components/home/header/header";
import MainAccount from "@/src/components/account/main";

export default function AccountPage() {
    return (
        <div className="min-h-screen overflow-x-clip bg-[#161616] text-slate-900">
            <HeaderHome />
            <MainAccount />
        </div>
    )
}