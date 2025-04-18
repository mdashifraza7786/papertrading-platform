export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:px-20 my-7">
      {children}
    </div>
  );
} 