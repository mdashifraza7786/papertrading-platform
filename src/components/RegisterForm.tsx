"use client"
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { ThreeDots } from 'react-loader-spinner';


const RegisterForm = (): React.ReactNode => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmpassword, setConfirmpassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleConfirmpasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmpassword(e.target.value);
    };

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setLoading(true); 
            const formData = new FormData(event.currentTarget);
            const username = formData.get('name') as string;
            const useremail = formData.get('email') as string;
            const userpassword = formData.get('password') as string;
            const usercpassword = formData.get('confirmPassword') as string;
            if(userpassword !== usercpassword){
                toast.error("Password and Confirm Password Doesn't Matched.");
                setLoading(false);
                return; 
            }
            const response = await fetch('/api/register', {
                method: 'POST',
                body: JSON.stringify({
                    name:username,
                    email:useremail,
                    password: userpassword,
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
            if (data.success === "ok") {

                toast.success(data.message || 'Login successful');
            } else {
                toast.error(data.message || 'Login Failed');

            }
            router.push("/login");
        } catch (error: any) {
            console.error('Error logging in:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="namefield" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="namefield"
                                className="input-field pl-10"
                                value={name}
                                onChange={handleNameChange}
                                name="name"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>
                    
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
                                value={email}
                                onChange={handleEmailChange}
                                name="email"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="passwordfield" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
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
                                value={password}
                                onChange={handlePasswordChange}
                                name="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="cpasswordfield" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <input
                                type="password"
                                id="cpasswordfield"
                                className="input-field pl-10"
                                value={confirmpassword}
                                onChange={handleConfirmpasswordChange}
                                name="confirmPassword"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                </div>
                
                <div>
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
                            'Create Account'
                        )}
                    </button>
                </div>
                
                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </form>
            <ToastContainer />
        </>
    );
};

export default RegisterForm;
