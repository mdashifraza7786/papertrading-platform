"use client"
import Link from 'next/link';
import { useState } from 'react';

const RegisterForm = (): React.ReactNode => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmpassword, setConfirmpassword] = useState('');

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

    return (
        <div className="bg-white shadow-[0_0_5px_1px_#fff] w-[70%] px-10 py-5 flex gap-10 flex-col">
            <div className="relative">
                <input
                    type="text"
                    id="namefield"
                    className={`border-b-2 peer focus:outline-none border-gray-400 w-full py-3`}
                    value={name}
                    onChange={handleNameChange}
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
                />
                <label
                    htmlFor="cpasswordfield"
                    className={`absolute left-0 -translate-y-1/2 transition-all cursor-text select-none duration-200 ${confirmpassword ? '-top-[7px] text-green-600' : 'top-1/2'}`}
                >
                    Enter Confirm Password
                </label>
            </div>
            <div className='relative'>
                <button className='bg-green-600 text-white py-2 text-lg px-10 font-semibold  outline outline-2 outline-offset-2 outline-green-600'>Create</button>
            </div>
            <div className='flex flex-col gap-2'>
                <p>Already have an account ? <Link href={"/login"} className='text-green-600 font-semibold'>Login here</Link></p>
            </div>
        </div>
    );
};

export default RegisterForm;
