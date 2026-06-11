export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, rgb(var(--bg-primary)) 0%, rgb(var(--accent-light)) 100%)" }}>
      {children}
    </div>
  );
}
