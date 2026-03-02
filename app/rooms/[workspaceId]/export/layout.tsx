'use client';

export default function ExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style jsx global>{`
        /* Hide navigation in export view */
        .site-nav {
          display: none !important;
        }
        /* Override workspace layout - hide source panel and make content full width */
        [data-export-mode] > div:first-child {
          display: none !important;
        }
        [data-export-mode] > div:last-child {
          padding: 0 !important;
          width: 100% !important;
        }
        @media print {
          .site-nav {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
      <div data-export-mode style={{ minHeight: '100vh', width: '100%' }}>
        {children}
      </div>
    </>
  );
}

