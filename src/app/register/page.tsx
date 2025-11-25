import RegisterForm from "@/components/RegisterForm";
import Link from "next/link";

const Register = () => {
    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-accent-primary flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold">
                        <span className="text-text-primary">Paper</span>
                        <span className="text-accent-primary">Trade</span>
                    </span>
                </Link>
                <h1 className="text-h1 text-text-primary mb-2">Create account</h1>
                <p className="text-text-secondary">Start your trading journey today</p>
            </div>

            <div className="card p-6 mb-4">
                <RegisterForm />
            </div>

            <p className="text-center text-text-muted text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-accent-primary hover:text-accent-glow font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    );
};

export default Register;
