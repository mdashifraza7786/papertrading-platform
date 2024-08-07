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
                <h1 className="font-semibold tracking-widest text-3xl px-5">Login</h1>
                <div className="px-10">
                    <h3>Demo Account</h3>
                    <p>Email: test.ashif@gmail.com</p>
                    <p>Password: 123456</p>
                </div>    
                <div className="md:grid md:grid-cols-2">
                    <div>
                        <LoginForm />
                    </div>
                    <div className="bg-cover bg-center relative md:block hidden">
                        <Image src="/loginpagesvg.svg" className="absolute -top-5 w-[75%]" width={100} height={100} objectFit="cover" loading="lazy"  alt="" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;
