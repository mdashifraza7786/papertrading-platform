import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";
const Register = () => {
  return (
    <>
    <div className="flex flex-col gap-16">
        <h1 className="font-semibold tracking-widest text-3xl px-5">Create Account</h1>
        <div className="md:grid md:grid-cols-2">
            <div>
                <RegisterForm />
            </div>
            <div className="bg-cover bg-center relative md:block hidden">
                <Image src="/registrationpagesvg.svg" className="absolute -top-5 w-[65%]" width={100} height={100} objectFit="cover" loading="lazy" alt="" />
            </div>
        </div>
    </div>
</>
  )
}

export default Register