export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import crypto from "crypto";

// Use /tmp for Vercel (read-write at runtime)
const SHARE_DIR = "/tmp/omega-shares";
const MAX_SHARE_BYTES = 200 * 1024; // 200KB
const SHARE_TTL_HOURS = 24 * 7; // 7 days

interface ShareMetadata {
  workspace: any;
  createdAt: number;
  expiresAt: number;
}

// Ensure share directory exists
async function ensureShareDir() {
  try {
    await fs.access(SHARE_DIR);
  } catch {
    await fs.mkdir(SHARE_DIR, { recursive: true });
  }
}

// Cleanup expired shares
async function cleanupExpiredShares() {
  try {
    const files = await fs.readdir(SHARE_DIR);
    const now = Date.now();
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = `${SHARE_DIR}/${file}`;
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const metadata: ShareMetadata = JSON.parse(content);
          if (metadata.expiresAt < now) {
            await fs.unlink(filePath);
          }
        } catch {
          // Ignore errors on individual files
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

function token() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function POST(req: NextRequest) {
  try {
    await ensureShareDir();
    await cleanupExpiredShares(); // Cleanup on each POST
    
    const { workspace } = await req.json();

    if (!workspace) {
      return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
    }

    const workspaceJson = JSON.stringify(workspace);
    
    // Enforce size limit
    const sizeBytes = Buffer.byteLength(workspaceJson, 'utf-8');
    if (sizeBytes > MAX_SHARE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Workspace too large (${Math.round(sizeBytes / 1024)}KB). Maximum size: ${MAX_SHARE_BYTES / 1024}KB` },
        { status: 400 }
      );
    }

    // Generate token
    const t = crypto.randomUUID().replace(/-/g, "");

    // Store workspace with metadata
    const now = Date.now();
    const metadata: ShareMetadata = {
      workspace,
      createdAt: now,
      expiresAt: now + (SHARE_TTL_HOURS * 60 * 60 * 1000),
    };
    const file = `${SHARE_DIR}/${t}.json`;
    await fs.writeFile(file, JSON.stringify(metadata, null, 2), 'utf8');

    // Build absolute URL from request
    const origin = req.nextUrl.origin;
    const url = `${origin}/share/${t}`;

    return NextResponse.json({ ok: true, token: t, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Share failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const t = req.nextUrl.searchParams.get("token");
    if (!t) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const file = `${SHARE_DIR}/${t}.json`;
    
    let raw: string;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const json: ShareMetadata = JSON.parse(raw);
    
    // Check expiry
    if (json.expiresAt < Date.now()) {
      // Delete expired share
      await fs.unlink(file).catch(() => {});
      return NextResponse.json({ error: "Share has expired" }, { status: 410 });
    }

    return NextResponse.json({ ok: true, workspace: json.workspace });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Not found" }, { status: 404 });
  }
}

