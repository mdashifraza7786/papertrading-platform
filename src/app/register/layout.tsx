export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      {children}
    </div>
  );
}
