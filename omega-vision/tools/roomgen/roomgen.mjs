#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { name: null, dest: null, dry: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--name") args.name = argv[++i];
    else if (a === "--dest") args.dest = argv[++i];
    else if (a === "--dry") args.dry = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!args.name) throw new Error("Missing required --name RoomName");
  return args;
}

function toCamel(name) {
  // RoomName -> roomName, AssuranceRoom -> assuranceRoom
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

const count = { files: 0 };

function copyDir(src, dst, replaceMap, dry) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  ensureDir(dst);
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const outName = applyReplacements(e.name, replaceMap);
    const dstPath = path.join(dst, outName);

    if (e.isDirectory()) {
      copyDir(srcPath, dstPath, replaceMap, dry);
    } else {
      const raw = fs.readFileSync(srcPath, "utf8");
      const patched = applyReplacements(raw, replaceMap);
      if (!dry) fs.writeFileSync(dstPath, patched, "utf8");
      count.files++;
    }
  }
}

function applyReplacements(text, replaceMap) {
  let out = text;
  for (const [from, to] of replaceMap) {
    out = out.split(from).join(to);
  }
  return out;
}

try {
  const { name, dest, dry } = parseArgs(process.argv);

  const templateRoot = path.join(__dirname, "templates", "RoomName");
  if (!fs.existsSync(templateRoot)) {
    throw new Error(`Template not found: ${templateRoot}`);
  }

  const repoRoot = path.resolve(__dirname, "..", ".."); // omega-vision/tools/roomgen -> omega-vision
  const outRoot = dest ? path.resolve(dest) : repoRoot;
  const outDir = path.join(outRoot, name);

  if (fs.existsSync(outDir)) {
    throw new Error(`Destination already exists: ${outDir}`);
  }

  const camel = toCamel(name);
  const replaceMap = [
    ["RoomName", name],
    ["ROOM_NAME", name],
    ["roomName", camel],
  ];

  if (!dry) ensureDir(outDir);
  copyDir(templateRoot, outDir, replaceMap, dry);

  console.log(`✅ Room generated: ${outDir}`);
  console.log(`   Files created: ${count.files}`);
  console.log(`   Next: add route + host + card in OmegaGallery (manual by design).`);
  if (dry) console.log(`(dry run; nothing written)`);
} catch (err) {
  console.error(`❌ roomgen failed: ${err.message}`);
  process.exit(1);
}

































