"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            ),
        },
        {
            name: "Markets",
            href: "/market/BTC",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
            ),
        },
        {
            name: "Portfolio",
            href: "/investment",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
        },
    ];

    const bottomNavItems = [
        {
            name: "Logout",
            href: "/logout",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
        },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40" style={{
            background: "#fff",
            borderRight: "1px solid rgb(var(--border))",
        }}>
            {/* Logo */}
            <div className="px-5 py-5 border-b" style={{ borderColor: "rgb(var(--border))" }}>
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgb(var(--accent-primary))" }}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-[17px] font-bold" style={{ color: "rgb(var(--text-primary))" }}>Paper</span>
                        <span className="text-[17px] font-bold" style={{ color: "rgb(var(--accent-primary))" }}>Trade</span>
                    </div>
                </Link>
            </div>

            {/* Main nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "rgb(var(--text-muted))" }}>
                    Main Menu
                </p>
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/market/BTC" && pathname.startsWith(item.href));
                        const isMarket = item.href === "/market/BTC" && pathname.startsWith("/market");
                        const active = isActive || isMarket;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={active ? "sidebar-link-active" : "sidebar-link"}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                                {active && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "rgb(var(--accent-primary))" }} />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom */}
            <div className="px-3 py-4 border-t" style={{ borderColor: "rgb(var(--border))" }}>
                {bottomNavItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="sidebar-link"
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
