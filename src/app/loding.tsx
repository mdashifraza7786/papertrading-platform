"use client"

const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-dark-tertiary" />
                    <div className="w-12 h-12 rounded-full border-2 border-accent-primary border-t-transparent animate-spin absolute inset-0" />
                </div>
                <p className="text-text-muted text-sm">Loading...</p>
            </div>
        </div>
    );
};

export default Loader;
