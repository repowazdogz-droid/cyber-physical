import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".md") || p.endsWith(".mdx"))) out.push(p);
  }
  return out;
}

function slugFromFile(fp) {
  const rel = path.relative(DOCS_DIR, fp).replaceAll("\\", "/");
  const noExt = rel.replace(/\.(md|mdx)$/, "");
  return "/docs/" + noExt;
}

const files = fs.existsSync(DOCS_DIR) ? walk(DOCS_DIR) : [];
const items = files.map(fp => ({
  file: path.relative(ROOT, fp).replaceAll("\\", "/"),
  slug: slugFromFile(fp),
}));

fs.writeFileSync(path.join(ROOT, "lib", "docs-inventory.json"), JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2));
console.log(`Wrote lib/docs-inventory.json with ${items.length} docs`);
























