import inv from "./docs-inventory.json";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const DOCS_ROOT = path.join(process.cwd(), "docs");

export type DocItem = { 
  file: string; 
  slug: string;
  title?: string;
  category?: string;
  excerpt?: string;
  path?: string;
  relPath?: string;
};

export function getDocsInventory(): { generatedAt: string; items: DocItem[] } {
  return inv as any;
}

export function findDocBySlug(slugPath: string): DocItem | null {
  const norm = slugPath.startsWith("/docs/") ? slugPath : `/docs/${slugPath.replace(/^\//, "")}`;
  const hit = (inv as any).items.find((x: any) => x.slug === norm);
  return hit || null;
}

function extractExcerpt(content: string): string {
  const lines = content.split("\n").filter(l => l.trim());
  for (const line of lines) {
    if (line.trim() && !line.startsWith("#") && line.length > 20) {
      return line.trim().substring(0, 150) + (line.length > 150 ? "..." : "");
    }
  }
  return "Documentation";
}

function enrichDocItem(item: { file: string; slug: string }): DocItem {
  const full = path.join(process.cwd(), item.file);
  if (!fs.existsSync(full)) {
    return { ...item, title: path.basename(item.file, path.extname(item.file)) };
  }
  
  try {
    const raw = fs.readFileSync(full, "utf8");
    const parsed = matter(raw);
    const rel = path.relative(DOCS_ROOT, full).replace(/\\/g, "/");
    const category = rel.split("/")[0] || "other";
    
    return {
      ...item,
      title: (parsed.data?.title as string) || path.basename(item.file, path.extname(item.file)).replace(/-/g, " "),
      category,
      excerpt: extractExcerpt(parsed.content),
      path: item.slug,
      relPath: rel,
    };
  } catch {
    return { ...item, title: path.basename(item.file, path.extname(item.file)) };
  }
}

let cachedIndex: DocItem[] | null = null;

export function getDocsIndex(): DocItem[] {
  if (cachedIndex) return cachedIndex;
  const inv = getDocsInventory();
  cachedIndex = inv.items.map(enrichDocItem);
  return cachedIndex;
}

export function getCategories(): string[] {
  const index = getDocsIndex();
  return Array.from(new Set(index.map(item => item.category || "other"))).sort();
}

export function getDocsByCategory(category: string): DocItem[] {
  return getDocsIndex().filter(item => item.category === category);
}

export function getDocBySlug(slug: string): DocItem | null {
  const normalized = slug.startsWith("/docs/") ? slug : `/docs/${slug}`;
  return getDocsIndex().find(item => item.slug === normalized || item.path === normalized) || null;
}

export interface RoleShortcuts {
  leadership: string[];
  staff: string[];
  parents: string[];
}

export function getRoleShortcuts(): RoleShortcuts {
  return {
    leadership: [
      "foundations/principles",
      "framework/pillars",
      "framework/role-translations",
      "delivery/implementation-cycles",
      "delivery/inspection-framing",
      "governance/safeguarding",
      "business/core-offer",
    ],
    staff: [
      "foundations/principles",
      "framework/pillars",
      "framework/process-maps",
      "delivery/modules/module-01-foundations",
      "delivery/modules/module-03-classroom-predictability",
      "delivery/modules/module-04-repair-boundaries",
      "delivery/reflection-tools",
    ],
    parents: [
      "foundations/principles",
      "framework/role-translations",
      "delivery/modules/module-07-parent-interface",
      "governance/ethics",
      "governance/refusal-boundaries",
    ],
  };
}
