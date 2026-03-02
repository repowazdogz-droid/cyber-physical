export function Section({
  title,
  children,
  id,
}: {
  title?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      style={{
        marginBottom: '4rem',
      }}
    >
      {title && (
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: '#171717',
        }}>
          {title}
        </h2>
      )}
      <div style={{
        fontSize: '1rem',
        lineHeight: '1.7',
        color: '#404040',
      }}>
        {children}
      </div>
    </section>
  );
}




























