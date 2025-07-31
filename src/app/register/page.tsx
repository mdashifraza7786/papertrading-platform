import RegisterForm from "@/components/RegisterForm";
import Image from "next/image";
const Register = () => {
  return (
    <>
    <div className="max-w-6xl w-full mx-auto overflow-hidden card-shadow rounded-2xl">
        <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-500">Join our paper trading platform and start your investment journey</p>
                </div>
                <RegisterForm />
            </div>
            <div className="hidden md:block w-1/2 bg-gradient-to-br from-green-50 to-green-100 p-12 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Image 
                        src="/registrationpagesvg.svg" 
                        width={400} 
                        height={400} 
                        alt="Registration illustration" 
                        className="object-contain" 
                        priority
                    />
                </div>
                <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk-Free Trading</h3>
                    <p className="text-gray-600">Practice trading strategies with virtual funds and gain experience without financial risk.</p>
                </div>
            </div>
        </div>
    </div>
</>
  )
}

export default Register