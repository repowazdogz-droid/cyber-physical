// app/admin/llm-runs/page.tsx

import React, { Suspense } from "react";
import Link from "next/link";
import { listArtifacts, getArtifact } from "@spine/artifacts/ArtifactVault";
import { ArtifactKind } from "@spine/artifacts/ArtifactTypes";
import type { ArtifactManifest, LLMRunArtifactPayload } from "@spine/artifacts/ArtifactTypes";
import type { OmegaMeta } from "@/spine/llm/modes/OmegaMeta";
import { OmegaMetaBadge } from "@/app/components/omega/OmegaMetaBadge";
import { Container } from "../../(site)/components/Container";
import { Section } from "../../(site)/components/Section";
import UiCard from "../../ui/UiCard";
const Card = UiCard;
import { FiltersBar } from "./FiltersBar";

function formatIso(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function clip(s: string, n = 180) {
  const t = String(s ?? "");
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

async function fetchRecent() {
  // Fetch enough manifests for filtering (pagination happens after filtering)
  const manifests = await listArtifacts({
    kind: ArtifactKind.LLM_RUN,
    learnerId: "public",
    limit: 1000, // Large limit for filtering, pagination happens after
  });

  return manifests;
}

async function fetchPayload(artifactId: string): Promise<LLMRunArtifactPayload | null> {
  try {
    const bundle = await getArtifact(artifactId);
    if (!bundle || !bundle.payloads) return null;
    
    // Extract LLMRunArtifactPayload from bundle payloads
    // The payload structure from putArtifact is: { meta: {...}, prompt: {...}, output: {...}, kind: "...", createdAtIso: "..." }
    // bundle.payloads is a Record<string, any>, so we need to find the LLMRunArtifactPayload fields
    const payloads = bundle.payloads as any;
    
    // Check if payloads has the LLMRunArtifactPayload structure directly
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

// Filter helpers
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

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function AdminLLMRunsPage({ searchParams = {} }: PageProps) {
  // Extract filter params (handle string | string[] | undefined)
  const getParam = (key: string): string => {
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0] || "";
    return val || "";
  };

  const modeFilter = getParam("mode");
  const auditFilter = getParam("audit");
  const retryFilter = getParam("retry");
  const searchQuery = getParam("q");
  const limitParam = getParam("limit");
  const offsetParam = getParam("offset");

  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 50;
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

  const manifests = await fetchRecent();

  // Apply manifest-level filters (no payload fetch needed)
  let filteredManifests = manifests.filter((m) => {
    // Mode filter
    if (modeFilter) {
      const mode = extractMode(m);
      if (mode !== modeFilter) return false;
    }

    // Audit filter
    if (auditFilter) {
      const auditOk = extractAuditOk(m);
      if (auditFilter === "ok" && auditOk !== true) return false;
      if (auditFilter === "fail" && auditOk !== false) return false;
      if (auditFilter === "none" && auditOk !== null) return false;
    }

    // Retry filter
    if (retryFilter) {
      const retried = extractRetried(m);
      if (retryFilter === "1" && !retried) return false;
      if (retryFilter === "0" && retried) return false;
    }

    return true;
  });

  // Sort stably (by createdAtIso descending, fallback to artifactId)
  filteredManifests = sortManifests(filteredManifests);

  // Apply pagination before fetching payloads (performance)
  const paginated = filteredManifests.slice(offset, offset + limit);

  // Fetch payloads for paginated manifests (for search and display)
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

  // Build export URL with current query params
  const exportParams = new URLSearchParams();
  if (modeFilter) exportParams.set("mode", modeFilter);
  if (auditFilter) exportParams.set("audit", auditFilter);
  if (retryFilter) exportParams.set("retry", retryFilter);
  if (searchQuery) exportParams.set("q", searchQuery);
  if (limitParam) exportParams.set("limit", limitParam);
  if (offsetParam) exportParams.set("offset", offsetParam);
  const exportUrl = `/admin/llm-runs/export?${exportParams.toString()}`;

  return (
    <Section>
      <Container>
        <div className="row-between">
          <div>
            <h1 className="h1">LLM Runs</h1>
            <p className="p-muted">
              Recent bounded LLM runs captured as artifacts (LLM_RUN). Read-only.
            </p>
          </div>
          {finalManifests.length > 0 && (
            <a
              href={exportUrl}
              className="btn"
              style={{ textDecoration: "none" }}
            >
              Export JSON
            </a>
          )}
        </div>

        <Suspense fallback={<div className="p-muted">Loading filters...</div>}>
          <FiltersBar />
        </Suspense>

        <div className="stack">
          {finalManifests.length === 0 ? (
            <Card>
              <p className="p">No LLM runs found yet.</p>
              <p className="p-muted">
                Trigger an explain/specDraft request (with or without an Omega mode) to generate entries.
              </p>
            </Card>
          ) : (
            finalManifests.map((m) => {
              const payload = payloadMap.get(m.artifactId) as LLMRunArtifactPayload | null | undefined;

              const createdAt =
                payload?.createdAtIso ||
                m.createdAtIso ||
                (m as any).meta?.createdAtIso;

              const kind = payload?.kind ?? "unknown";
              const promptSnippet = payload?.prompt?.text ? clip(payload.prompt.text, 160) : "";
              const outSnippet = payload?.output?.text ? clip(payload.output.text, 220) : "";

              // omega meta: prefer manifest.omega, fallback to manifest.meta.omega for older artifacts
              const omega = m.omega ?? (m as any).meta?.omega;
              
              // Extract audit and retry status for display
              const auditOk = extractAuditOk(m);
              const retried = extractRetried(m);
              const auditStatus = auditOk === null ? "—" : auditOk ? "OK" : "FAIL";
              const retryStatus = retried ? "yes" : "no";

              return (
                <Card key={m.artifactId} variant="elevated">
                  <div className="row-between">
                    <div>
                      <div className="kicker">{kind.toUpperCase()}</div>
                      <div className="p-muted">{formatIso(createdAt)}</div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--muted)", marginTop: "var(--s-2)" }}>
                        Audit: {auditStatus} · Retry: {retryStatus}
                      </div>
                    </div>
                    {omega ? <OmegaMetaBadge omega={omega} /> : null}
                  </div>

                  {promptSnippet ? (
                    <div className="mt">
                      <div className="label">Prompt (bounded)</div>
                      <pre className="pre">{promptSnippet}</pre>
                    </div>
                  ) : null}

                  {outSnippet ? (
                    <div className="mt">
                      <div className="label">Output (bounded)</div>
                      <pre className="pre">{outSnippet}</pre>
                    </div>
                  ) : null}

                  <div className="mt p-muted">
                    <Link href={`/admin/llm-runs/${m.artifactId}`} className="mono" style={{ color: "inherit", textDecoration: "none" }}>
                      id: {m.artifactId}
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Container>
    </Section>
  );
}

