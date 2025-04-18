export default function RegisterLayout({
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