import ProtocolNav from './ProtocolNav';

export default function ProtocolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#171717',
    }}>
      <ProtocolNav />
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 2rem 4rem',
        lineHeight: '1.7',
        fontSize: '1rem',
      }}>
        {children}
      </main>
      <footer style={{
        borderTop: '1px solid #e5e5e5',
        padding: '2rem',
        marginTop: '4rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#737373',
      }}>
        <p>Omega Protocol — Infrastructure for reasoning under uncertainty</p>
      </footer>
    </div>
  );
}




























