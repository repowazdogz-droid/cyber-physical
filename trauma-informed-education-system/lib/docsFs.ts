import fs from "node:fs";
import path from "node:path";

export const DOCS_ROOT = path.join(process.cwd(), "docs");

export function listAllDocs(): string[] {
  const out: string[] = [];
  function walk(dir: string, rel: string) {
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name);
      const nextRel = rel ? path.join(rel, name) : name;
      const st = fs.statSync(abs);
      if (st.isDirectory()) walk(abs, nextRel);
      else if (st.isFile() && name.endsWith(".md")) out.push(nextRel);
    }
  }
  if (fs.existsSync(DOCS_ROOT)) walk(DOCS_ROOT, "");
  return out.sort();
}

export function resolveDocPath(slugParts: string[]): { abs: string; rel: string } | null {
  const rel = path.join(...slugParts) + ".md";
  const abs = path.join(DOCS_ROOT, rel);
  if (fs.existsSync(abs)) return { abs, rel };
  return null;
}
























