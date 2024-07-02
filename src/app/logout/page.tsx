"use client"

import { useEffect } from 'react';
import Loader from '../loding';

const Logout = () => {
    useEffect(() => {
        const doLogout = async () => {
            try {
                const response = await fetch('/api/logout');

                if (response.ok) {
                    // Redirect to the login page or another appropriate route
                    window.location.href = '/login';
                } else {
                    console.error('Failed to log out:', response.statusText);
                    // Optionally handle error state or display error message
                }
            } catch (error) {
                console.error('Error during logout:', error);
                // Handle network or other errors
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

