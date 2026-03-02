// app/admin/llm-runs/[id]/page.tsx

import React from "react";
import Link from "next/link";
import { getArtifact } from "@spine/artifacts/ArtifactVault";
import type { LLMRunArtifactPayload, ArtifactManifest } from "@spine/artifacts/ArtifactTypes";
import { OmegaMetaBadge } from "@/app/components/omega/OmegaMetaBadge";
import { Container } from "../../../(site)/components/Container";
import { Section } from "../../../(site)/components/Section";
import UiCard from "../../../ui/UiCard";
const Card = UiCard;
import { CopyButton } from "../CopyButton";

function formatIso(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

async function fetchOne(id: string) {
  const bundle = await getArtifact(id);
  if (!bundle) {
    throw new Error("Artifact not found");
  }

  const manifest = bundle.manifest;
  
  // Extract LLMRunArtifactPayload from bundle payloads
  const payloads = bundle.payloads as any;
  let payload: LLMRunArtifactPayload | null = null;
  
  if (payloads.prompt && payloads.output && payloads.kind) {
    payload = {
      kind: payloads.kind,
      createdAtIso: payloads.createdAtIso,
      prompt: payloads.prompt,
      output: payloads.output,
    } as LLMRunArtifactPayload;
  }

  return {
    manifest,
    payload,
  };
}

export default async function LLMRunDetailPage({ params }: { params: { id: string } }) {
  const { manifest, payload } = await fetchOne(params.id);

  const omega = manifest.omega ?? (manifest as any).meta?.omega;
  const createdAt =
    payload?.createdAtIso || manifest.createdAtIso || (manifest as any).meta?.createdAtIso;

  const promptText = payload?.prompt?.text ?? "";
  const outputText = payload?.output?.text ?? "";

  return (
    <Section>
      <Container>
        <div className="row-between">
          <div>
            <h1 className="h1">LLM Run</h1>
            <p className="p-muted">
              {payload?.kind ? payload.kind.toUpperCase() : "LLM_RUN"} · {formatIso(createdAt)}
            </p>
            <p className="p-muted">
              <span className="mono">id:</span> {manifest.artifactId}
            </p>
          </div>
          {omega ? <OmegaMetaBadge omega={omega} /> : null}
        </div>

        <div className="mt">
          <Link href="/admin/llm-runs" className="btn">
            ← Back to list
          </Link>
        </div>

        <div className="mt">
          <Card variant="elevated">
            <div className="row-between">
              <div>
                <div className="label">Prompt (bounded)</div>
                <div className="p-muted">{promptText.length} chars</div>
              </div>
              <CopyButton text={promptText} label="Copy prompt" />
            </div>
            <pre className="pre mt">{promptText}</pre>
          </Card>
        </div>

        <div className="mt">
          <Card variant="elevated">
            <div className="row-between">
              <div>
                <div className="label">Output (bounded)</div>
                <div className="p-muted">{outputText.length} chars</div>
              </div>
              <CopyButton text={outputText} label="Copy output" />
            </div>
            <pre className="pre mt">{outputText}</pre>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

