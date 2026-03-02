import { getDocsInventory } from "@/lib/docsIndex";

export const dynamic = "force-dynamic";

async function head(url: string) {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    return r.status;
  } catch {
    return 0;
  }
}

export default async function DocsHealth() {
  const inv = getDocsInventory();
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const rows = await Promise.all(
    inv.items.map(async (x) => {
      const status = await head(base + x.slug);
      return { ...x, status };
    })
  );

  const broken = rows.filter(r => r.status !== 200 && r.status !== 307 && r.status !== 308);

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Docs Health</h1>
      <div style={{ color: "#555", marginBottom: 16 }}>
        Generated: {inv.generatedAt} • Docs: {rows.length} • Broken: {broken.length}
      </div>

      {broken.length > 0 && (
        <div style={{ padding: 12, border: "1px solid #f3c", borderRadius: 10, marginBottom: 16 }}>
          <b>Broken routes:</b>
          <ul>
            {broken.map(b => <li key={b.slug}>{b.slug} → {b.status}</li>)}
          </ul>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left" style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Slug</th>
            <th align="left" style={{ borderBottom: "1px solid #ddd", padding: 8 }}>File</th>
            <th align="left" style={{ borderBottom: "1px solid #ddd", padding: 8 }}>HTTP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.slug}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <a href={r.slug} style={{ color: "#2563eb", textDecoration: "underline" }}>{r.slug}</a>
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.file}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
























