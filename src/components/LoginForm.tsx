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
        <form onSubmit={handleLogin} className="max-w-md mx-auto">
            <div className="card p-8 space-y-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                    <p className="text-gray-500">Sign in to your account to continue</p>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="emailfield" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <input
                                type="email"
                                id="emailfield"
                                className="input-field pl-10"
                                value={emailcheck}
                                onChange={handleEmailChange}
                                name="email"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label htmlFor="passwordfield" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <Link href="/forget-password" className="text-sm text-green-600 hover:text-green-700">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                            </div>
                            <input
                                type="password"
                                id="passwordfield"
                                className="input-field pl-10"
                                value={passwordcheck}
                                onChange={handlePasswordChange}
                                name="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    className="button-primary w-full flex justify-center items-center" 
                    disabled={loading}
                >
                    {loading ? (
                        <ThreeDots
                            visible={true}
                            height="24"
                            width="50"
                            color="#ffffff"
                            radius="3"
                            ariaLabel="three-dots-loading"
                        />
                    ) : (
                        'Sign in'
                    )}
                </button>
                
                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </form>
        <ToastContainer/>
        </>
    );
};

export default LoginForm;

