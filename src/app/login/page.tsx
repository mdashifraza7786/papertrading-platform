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
            <div className="max-w-6xl w-full mx-auto overflow-hidden card-shadow rounded-2xl">
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome Back</h1>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-medium text-blue-800 mb-1">Demo Account</h3>
                                <p className="text-sm text-blue-700">Email: test.ashif@gmail.com</p>
                                <p className="text-sm text-blue-700">Password: 123456</p>
                            </div>
                        </div>
                        <LoginForm />
                    </div>
                    <div className="hidden md:block w-1/2 bg-gradient-to-br from-green-50 to-green-100 p-12 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image 
                                src="/loginpagesvg.svg" 
                                width={400} 
                                height={400} 
                                alt="Login illustration" 
                                className="object-contain" 
                                priority
                            />
                        </div>
                        <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paper Trading Platform</h3>
                            <p className="text-gray-600">Practice trading cryptocurrencies with virtual money. Build your skills without risking real funds.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;
