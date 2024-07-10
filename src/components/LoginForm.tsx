"use client"

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { ThreeDots } from 'react-loader-spinner'; 
import 'react-toastify/dist/ReactToastify.css';

const LoginForm = (): React.ReactNode => {
    const [emailcheck, setEmailcheck] = useState('');
    const [passwordcheck, setPasswordcheck] = useState('');
    const [loading, setLoading] = useState(false); 

    const router = useRouter();

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailcheck(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordcheck(e.target.value);
    };

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setLoading(true); // Start showing loading indicator
            const formData = new FormData(event.currentTarget);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            const response = await fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to login');
            }

            const data = await response.json();
            if(data.success === "ok"){
                toast.success(data.message || 'Login successful');
                
            }else{
                toast.error(data.message || 'Login Failed');
                
            }
            router.refresh();
        } catch (error: any) {
            console.error('Error logging in:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false); 
        }
    };

    return (
        <>
        <form onSubmit={handleLogin}>
            <div className="bg-white shadow-[0_0_5px_1px_#fff] md:w-[70%] px-10 py-5 flex gap-10 flex-col">
                <div className="relative">
                    <input
                        type="text"
                        id="emailfield"
                        className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                        value={emailcheck}
                        onChange={handleEmailChange}
                        name="email"
                        required
                    />
                    <label
                        htmlFor="emailfield"
                        className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${emailcheck && emailcheck.length > 0 ? '-top-[7px] text-green-600 ' : 'top-1/2'}`}
                    >
                        Enter Your Email
                    </label>
                </div>

                <div className="relative">
                    <input
                        type="password"
                        id="passwordfield"
                        className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                        value={passwordcheck}
                        onChange={handlePasswordChange}
                        name="password"
                        required
                    />
                    <label
                        htmlFor="passwordfield"
                        className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${passwordcheck && passwordcheck.length > 0 ? '-top-[7px] text-green-600 ' : 'top-1/2'}`}
                    >
                        Enter Your Password
                    </label>
                </div>
                
                <div className='relative'>
                    {/* Conditional rendering of loading spinner */}
                    <button className='bg-green-600 text-white py-2 text-lg px-10 font-semibold outline outline-2 outline-offset-2 outline-green-600' disabled={loading}>
                        {loading ? (
                            <ThreeDots
                                visible={true}
                                height="30"
                                width="42"
                                color="#ffffff"
                                radius="3"
                                ariaLabel="three-dots-loading"
                                wrapperStyle={{}}
                                wrapperClass=""
                            />
                        ) : (
                            'Login'
                        )}
                    </button>
                </div>
                <div className='flex flex-col gap-2'>
                    <p>Do not have an account? <Link href={"/register"} className='text-green-600 font-semibold'>Create account</Link></p>
                    <p>Forgot your password? <Link href={"/forget-password"} className='text-green-600 font-semibold'>Reset here</Link></p>
                </div>
            </div>
        </form>
        <ToastContainer/>
        </>
    );
};

export default LoginForm;

