// app/admin/llm-runs/export/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { listArtifacts, getArtifact } from "@spine/artifacts/ArtifactVault";
import { ArtifactKind } from "@spine/artifacts/ArtifactTypes";
import type { ArtifactManifest, LLMRunArtifactPayload } from "@spine/artifacts/ArtifactTypes";

// Filter helpers (shared with page.tsx)
function extractMode(manifest: ArtifactManifest): string {
  const omega = manifest.omega ?? (manifest as any).meta?.omega;
  return omega?.mode ?? "";
}

function extractAuditOk(manifest: ArtifactManifest): boolean | null {
  const omega = manifest.omega ?? (manifest as any).meta?.omega;
  if (!omega || !omega.audit) return null;
  return omega.audit.ok;
}

function extractRetried(manifest: ArtifactManifest): boolean {
  const omega = manifest.omega ?? (manifest as any).meta?.omega;
  return omega?.retry?.attempted ?? false;
}

function matchesSearch(payload: LLMRunArtifactPayload | null, query: string): boolean {
  if (!query || !payload) return true;
  const q = query.toLowerCase();
  const promptText = payload.prompt?.text?.toLowerCase() ?? "";
  const outputText = payload.output?.text?.toLowerCase() ?? "";
  return promptText.includes(q) || outputText.includes(q);
}

function sortManifests(manifests: ArtifactManifest[]): ArtifactManifest[] {
  return [...manifests].sort((a, b) => {
    const aTime = a.createdAtIso || (a as any).meta?.createdAtIso || "";
    const bTime = b.createdAtIso || (b as any).meta?.createdAtIso || "";
    
    if (aTime && bTime) {
      return bTime.localeCompare(aTime); // Descending (newest first)
    }
    if (aTime) return -1;
    if (bTime) return 1;
    // Fallback to artifactId
    return b.artifactId.localeCompare(a.artifactId);
  });
}

async function fetchPayload(artifactId: string): Promise<LLMRunArtifactPayload | null> {
  try {
    const bundle = await getArtifact(artifactId);
    if (!bundle || !bundle.payloads) return null;
    
    const payloads = bundle.payloads as any;
    
    if (payloads.prompt && payloads.output && payloads.kind) {
      return {
        kind: payloads.kind,
        createdAtIso: payloads.createdAtIso,
        prompt: payloads.prompt,
        output: payloads.output,
      } as LLMRunArtifactPayload;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter params
    const modeFilter = searchParams.get("mode") || "";
    const auditFilter = searchParams.get("audit") || "";
    const retryFilter = searchParams.get("retry") || "";
    const searchQuery = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 1000) : 1000; // Max 1000 for export
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    // Fetch all manifests
    const manifests = await listArtifacts({
      kind: ArtifactKind.LLM_RUN,
      learnerId: "public",
      limit: 10000, // Large limit for filtering
    });

    // Apply manifest-level filters
    let filteredManifests = manifests.filter((m) => {
      if (modeFilter) {
        const mode = extractMode(m);
        if (mode !== modeFilter) return false;
      }

      if (auditFilter) {
        const auditOk = extractAuditOk(m);
        if (auditFilter === "ok" && auditOk !== true) return false;
        if (auditFilter === "fail" && auditOk !== false) return false;
        if (auditFilter === "none" && auditOk !== null) return false;
      }

      if (retryFilter) {
        const retried = extractRetried(m);
        if (retryFilter === "1" && !retried) return false;
        if (retryFilter === "0" && retried) return false;
      }

      return true;
    });

    // Sort stably
    filteredManifests = sortManifests(filteredManifests);

    // Apply pagination
    const paginated = filteredManifests.slice(offset, offset + limit);

    // Fetch payloads for paginated manifests
    const payloads = await Promise.all(
      paginated.map(async (m) => {
        const payload = await fetchPayload(m.artifactId);
        return { id: m.artifactId, payload };
      })
    );

    // Apply search filter (requires payloads)
    let finalManifests = paginated;
    if (searchQuery) {
      finalManifests = paginated.filter((m) => {
        const payload = payloads.find((p) => p.id === m.artifactId)?.payload ?? null;
        return matchesSearch(payload, searchQuery);
      });
    }

    const payloadMap = new Map(payloads.map((p) => [p.id, p.payload]));

    // Build export data
    const exportData = finalManifests.map((m) => {
      const payload = payloadMap.get(m.artifactId) as LLMRunArtifactPayload | null | undefined;
      const omega = m.omega ?? (m as any).meta?.omega;

      return {
        manifest: {
          artifactId: m.artifactId,
          kind: m.kind,
          createdAtIso: m.createdAtIso || (m as any).meta?.createdAtIso,
          tags: m.tags,
          omega: omega ? {
            mode: omega.mode,
            audit: omega.audit,
            retry: omega.retry,
          } : undefined,
        },
        prompt: payload?.prompt,
        output: payload?.output,
      };
    });

    const json = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `llm-runs-export-${timestamp}.json`;

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export" },
      { status: 500 }
    );
  }
}









