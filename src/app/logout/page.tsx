"use client"

import { useEffect } from 'react';
import Loader from '../loding';

const Logout = () => {
    useEffect(() => {
        const doLogout = async () => {
            try {
                const response = await fetch('/api/logout');

                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    console.error('Failed to log out:', response.statusText);
                }
            } catch (error) {
                console.error('Error during logout:', error);
            }
        };

        doLogout();
      
    }, []);

    
    return (
        <div>
            <Loader/>
        </div>
    );
};

export default Logout;

