import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const Page = async () => {
    const session = await auth();
    if(session?.user){
        redirect('/dashboard');
    }
    return (
        <>
            <div className="flex flex-col gap-16">
                <h1 className="font-semibold tracking-widest text-3xl px-10">Login</h1>
                <div className="grid grid-cols-2">
                    <div>
                        <LoginForm />
                    </div>
                    <div className="bg-cover bg-center relative">
                        <Image src="/loginpagesvg.svg" className="absolute -top-5 w-[75%]" width={100} height={100} objectFit="cover" loading="lazy"  alt="" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;
