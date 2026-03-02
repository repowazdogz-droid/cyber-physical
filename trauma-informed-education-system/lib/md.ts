import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export const DOCS_ROOT = path.join(process.cwd(), "docs");

function safeJoin(root: string, rel: string) {
  const p = path.join(root, rel);
  const normRoot = path.normalize(root + path.sep);
  const normP = path.normalize(p);
  if (!normP.startsWith(normRoot)) throw new Error("Invalid path");
  return p;
}

export async function renderMarkdownFromDocs(slugParts: string[]) {
  const rel = slugParts.join("/") + ".md";
  const full = safeJoin(DOCS_ROOT, rel);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf8");
  const parsed = matter(raw);
  const processed = await remark().use(html).process(parsed.content);
  return {
    title: (parsed.data?.title as string) || slugParts[slugParts.length - 1] || "Doc",
    html: processed.toString(),
    relPath: rel,
  };
}

export async function renderMarkdownFile(filePath: string) {
  const full = path.join(process.cwd(), filePath);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf8");
  const parsed = matter(raw);
  const processed = await remark().use(html).process(parsed.content);
  return {
    title: (parsed.data?.title as string) || path.basename(filePath, path.extname(filePath)),
    html: processed.toString(),
    relPath: path.relative(process.cwd(), full),
  };
}

export function listTopDocs() {
  const groups = [
    "foundations",
    "framework",
    "delivery",
    "ai",
    "governance",
    "evidence",
    "business",
    "future",
  ];
  const items: Array<{ group: string; path: string; label: string }> = [];
  for (const g of groups) {
    const dir = path.join(DOCS_ROOT, g);
    if (!fs.existsSync(dir)) continue;
    const walk = (d: string) => {
      for (const name of fs.readdirSync(d)) {
        const p = path.join(d, name);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) walk(p);
        else if (name.endsWith(".md")) {
          const rel = path.relative(DOCS_ROOT, p).replace(/\\/g, "/");
          items.push({
            group: g,
            path: "/docs/" + rel.replace(/\.md$/, ""),
            label: rel.replace(/\.md$/, ""),
          });
        }
      }
    };
    walk(dir);
  }
  items.sort((a, b) => a.label.localeCompare(b.label));
  return items;
}

export function getBreadcrumb(slug: string[]): Array<{ label: string; href: string }> {
  const crumbs: Array<{ label: string; href: string }> = [{ label: "Home", href: "/" }];
  if (slug.length > 0) {
    crumbs.push({ label: "Docs", href: "/docs" });
    for (let i = 0; i < slug.length; i++) {
      const part = slug[i];
      const label = part.replace(/-/g, " ");
      const href = "/docs/" + slug.slice(0, i + 1).join("/");
      crumbs.push({ label, href });
    }
  }
  return crumbs;
}

export function getNextPrev(slug: string[]): { next: { title: string; href: string } | null; prev: { title: string; href: string } | null } {
  const allDocs = listTopDocs();
  const currentPath = "/docs/" + slug.join("/");
  const currentIdx = allDocs.findIndex((d) => d.path === currentPath);
  if (currentIdx === -1) return { next: null, prev: null };
  const next = currentIdx < allDocs.length - 1 ? {
    title: allDocs[currentIdx + 1]!.label.split("/").pop()!.replace(/-/g, " "),
    href: allDocs[currentIdx + 1]!.path,
  } : null;
  const prev = currentIdx > 0 ? {
    title: allDocs[currentIdx - 1]!.label.split("/").pop()!.replace(/-/g, " "),
    href: allDocs[currentIdx - 1]!.path,
  } : null;
  return { next, prev };
}
