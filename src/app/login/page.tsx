import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import Link from "next/link";

const Page = async () => {
    const session = await auth();
    if (session?.user) {
        redirect("/dashboard");
    }

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgb(var(--accent-primary))" }}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold">
                        <span style={{ color: "rgb(var(--text-primary))" }}>Paper</span>
                        <span style={{ color: "rgb(var(--accent-primary))" }}>Trade</span>
                    </span>
                </Link>
                <h1 className="text-2xl font-bold mb-1" style={{ color: "rgb(var(--text-primary))" }}>
                    Welcome back
                </h1>
                <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>
                    Sign in to continue trading
                </p>
            </div>

            {/* Card */}
            <div className="card p-7 mb-4">
                {/* Demo credentials banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl mb-6"
                    style={{ background: "rgb(var(--accent-light))", border: "1px solid rgba(0,176,80,0.2)" }}>
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--accent-primary))" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold mb-1" style={{ color: "rgb(var(--accent-primary))" }}>Demo Account</p>
                        <p className="text-xs" style={{ color: "rgb(var(--text-secondary))" }}>Email: test.ashif@gmail.com</p>
                        <p className="text-xs" style={{ color: "rgb(var(--text-secondary))" }}>Password: 123456</p>
                    </div>
                </div>
                <LoginForm />
            </div>

            <p className="text-center text-sm" style={{ color: "rgb(var(--text-muted))" }}>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold" style={{ color: "rgb(var(--accent-primary))" }}>
                    Create one
                </Link>
            </p>
        </div>
    );
};

export default Page;
