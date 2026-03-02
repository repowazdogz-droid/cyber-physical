export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-container">
      <div className="site-main">{children}</div>
    </div>
  );
}

