"use client"
import Link from "next/link"
import NextTopLoader from "nextjs-toploader"
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const Header = ({ sess }: any) => {
    const [loggedin, setLoggedin] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();
    if (!sess?.user && pathname !== "/" && pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
    }else if(sess?.user){
        router.push("/dashboard");
    }
    
    useEffect(() => {
        if (sess?.user) {
            setLoggedin(true);
        } else {
            setLoggedin(false);
        }
    }, [sess?.user, pathname])
    return (
        <>
            <NextTopLoader color="#16A34A" />
            <div className="h-[5rem] px-20 shadow-[0_0_10px_1px_#ddd] sticky top-0 left-0 bg-white z-10 flex justify-between items-center">
                <div className="logo">
                    <Link href={"/dashboard"}>
                        <h1 className="text-green-600 uppercase font-bold tracking-wider text-2xl ">
                            PAPERTRADING
                        </h1>
                    </Link>
                </div>
                <div>
                    <ul className="flex gap-5 font-medium">
                        {loggedin === true ? (
                            <>
                                <Link href={"/dashboard"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Dashboard</li>
                                </Link>
                                <Link href={"/account"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">My Account</li>
                                </Link>
                                <Link href={"/logout"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Logout</li>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href={"/"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Home</li>
                                </Link>
                                <Link href={"/login"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Login</li>
                                </Link>
                                <Link href={"/register"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Signup</li>
                                </Link>
                            </>
                        )}

                    </ul>
                </div>
            </div>
        </>

    )
}

export default Header