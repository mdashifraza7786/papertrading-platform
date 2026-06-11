"use client"

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { WebSocketProvider } from "./WebSocketProvider";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <WebSocketProvider>
            <div className="min-h-screen bg-background-primary">
                <Sidebar />
                <div className="ml-60">
                    <TopBar />
                    <main className="p-6">
                        {children}
                    </main>
                </div>
            </div>
        </WebSocketProvider>
    );
};

export default DashboardLayout;

