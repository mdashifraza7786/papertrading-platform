"use client"

import { useEffect } from "react";

const Logout = () => {
    useEffect(() => {
        const doLogout = async () => {
            try {
                const response = await fetch("/api/logout");
                if (response.ok) {
                    window.location.href = "/login";
                }
            } catch (error) {
                console.error("Logout failed:", error);
                window.location.href = "/login";
            }
        };
        doLogout();
    }, []);

    return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">Signing out...</p>
            </div>
        </div>
    );
};

export default Logout;
