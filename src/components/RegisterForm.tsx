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
            <form onSubmit={handleLogin}>
                <div className="bg-white shadow-[0_0_5px_1px_#fff] w-[70%] px-10 py-5 flex gap-10 flex-col">
                    <div className="relative">
                        <input
                            type="text"
                            id="namefield"
                            className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                            value={name}
                            onChange={handleNameChange}
                            name="name"
                        />
                        <label
                            htmlFor="namefield"
                            className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${name ? '-top-[7px] text-green-600' : 'top-1/2'}`}
                        >
                            Enter Your Name
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            id="emailfield"
                            className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                            value={email}
                            onChange={handleEmailChange}
                            name="email"
                        />
                        <label
                            htmlFor="emailfield"
                            className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${email ? '-top-[7px] text-green-600' : 'top-1/2'}`}
                        >
                            Enter Valid Email
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            id="passwordfield"
                            className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                            value={password}
                            onChange={handlePasswordChange}
                            name="password"
                        />
                        <label
                            htmlFor="passwordfield"
                            className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${password ? '-top-[7px] text-green-600' : 'top-1/2'}`}
                        >
                            Enter Your Password
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            id="cpasswordfield"
                            className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                            value={confirmpassword}
                            onChange={handleConfirmpasswordChange}
                            name="confirmPassword"
                        />
                        <label
                            htmlFor="cpasswordfield"
                            className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${confirmpassword ? '-top-[7px] text-green-600' : 'top-1/2'}`}
                        >
                            Enter Confirm Password
                        </label>
                    </div>
                    <div className='relative'>
                        <button className='bg-green-600 text-white py-2 text-lg px-10 font-semibold  outline outline-2 outline-offset-2 outline-green-600' disabled={loading ? true : false}>
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
                            'Create'
                        )}
                        </button>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <p>Already have an account ? <Link href={"/login"} className='text-green-600 font-semibold'>Login here</Link></p>
                    </div>
                </div>
            </form>
            <ToastContainer />
        </>
    );
};

export default RegisterForm;
