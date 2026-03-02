import Link from "next/link";
import { findDocBySlug } from "@/lib/docsIndex";
import { renderMarkdownFile } from "@/lib/md";

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = "/docs/" + (Array.isArray(slug) ? slug.join("/") : slug);
  const hit = findDocBySlug(path);
  
  if (!hit) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Document not found</h1>
        <p className="text-muted-foreground">
          This link doesn't match a file in <code className="px-1 py-0.5 rounded bg-muted">docs/</code>.
        </p>
        <Link className="btn btn-secondary" href="/docs">Go to Docs</Link>
      </div>
    );
  }

  const doc = await renderMarkdownFile(hit.file);
  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Error loading document</h1>
        <p className="text-muted-foreground">Could not render the markdown file.</p>
        <Link className="btn btn-secondary" href="/docs">Go to Docs</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link className="underline" href="/docs">Docs</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{hit.slug.replace("/docs/", "")}</span>
      </div>
      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </div>
  );
}
