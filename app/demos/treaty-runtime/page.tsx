"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UiCard from "../../learning/ui/UiCard";
import { SPACING, TEXT_SIZES } from "../../learning/ui/uiTokens";

const spacing = SPACING.standard;
const text = TEXT_SIZES.standard;

type VerificationStatus = "PASS" | "FAIL";

type ProofVerification = {
  verifiedAtMs: number;
  status: VerificationStatus;
  okChain: boolean;
  okPolicyBinding: boolean;
  okDeterminism?: boolean;
  unverifiable?: boolean;
  details: string;
};

type ProofBundle = {
  meta: {
    demo: string;
    schemaVersion: string;
    hashAlgo: string;
    exportedAtMs: number;
    policy: any;
    policyCommitment: string;
    initialState?: any;
  };
  trace: any[];
  verification?: ProofVerification;
};

type ServerVerifyResponse = {
  ok: boolean;
  schemaVersion: string;
  verification: ProofVerification;
  stats: {
    recordCount: number;
    badIndex: number | null;
    hadJson?: boolean;
    signingEnabled?: boolean;
  };
  notes: string[];
};

type RegistryItem = {
  id: string;
  savedAtMs: number;
  schemaVersion: string;
  proof: ProofBundle;
};

const REGISTRY_KEY = "omega_proof_registry_v1";

function statusChip(status?: VerificationStatus | null) {
  const bg =
    status === "PASS"
      ? "#dcfce7"
      : status === "FAIL"
      ? "#fee2e2"
      : "#f3f4f6";
  const color =
    status === "PASS"
      ? "#166534"
      : status === "FAIL"
      ? "#b91c1c"
      : "#4b5563";
  const label = status ?? "—";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        backgroundColor: bg,
        color,
        minWidth: 40,
      }}
    >
      {label}
    </span>
  );
}

function agreementSummary(statuses: (VerificationStatus | null)[]) {
  const nonNull = statuses.filter((s): s is VerificationStatus => s !== null);
  if (nonNull.length < 2) {
    return { agreement: false, reason: "Not enough verifiers run" };
  }
  const allSame = nonNull.every((s) => s === nonNull[0]);
  if (allSame) {
    return { agreement: true, reason: "" };
  }
  if (statuses[0] && statuses[1] && statuses[0] !== statuses[1]) {
    return { agreement: false, reason: "Run vs Browser mismatch" };
  }
  if (statuses[0] && statuses[2] && statuses[0] !== statuses[2]) {
    return { agreement: false, reason: "Run vs Verifier node mismatch" };
  }
  if (statuses[1] && statuses[2] && statuses[1] !== statuses[2]) {
    return { agreement: false, reason: "Browser vs Verifier node mismatch" };
  }
  return { agreement: false, reason: "Mismatch between verifiers" };
}

function loadFromRegistry(id: string): ProofBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistryItem[] | any;
    if (!Array.isArray(parsed)) return null;
    const entry = (parsed as any[]).find((x) => x && x.id === id);
    if (!entry || !entry.proof) return null;
    return entry.proof as ProofBundle;
  } catch {
    return null;
  }
}

function canonicalize(value: unknown): unknown {
  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    throw new Error("Non-canonicalizable value");
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite number");
    }
    return value;
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => canonicalize(v));
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "undefined") continue;
    out[k] = canonicalize(v);
  }
  return out;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

async function sha256HexBrowser(str: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WebCrypto unavailable");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTrrClient(bundle: ProofBundle): Promise<ProofVerification> {
  const verifiedAtMs = Date.now();
  try {
    const meta = bundle.meta;
    const records = Array.isArray(bundle.trace) ? (bundle.trace as any[]) : [];
    const lines: string[] = [];
    let okChain = true;
    let okPolicyBinding = true;
    let okInspectability = true;

    if (meta.hashAlgo && meta.hashAlgo !== "SHA-256") {
      lines.push(`Unsupported hashAlgo: ${meta.hashAlgo} (expected SHA-256).`);
      okChain = false;
    }

    const commit = await sha256HexBrowser(canonicalJson(meta.policy));
    if (meta.policyCommitment && meta.policyCommitment !== commit) {
      lines.push(
        `Policy commitment mismatch: recorded=${meta.policyCommitment.substring(
          0,
          16
        )}…, recomputed=${commit.substring(0, 16)}…`
      );
      okPolicyBinding = false;
    }

    // Quick policy binding + chain semantics only (no hash recompute)
    let baselineCommitment = meta.policyCommitment;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.index !== i) {
        okChain = false;
        lines.push(`Index mismatch at position ${i}: record.index=${r.index}.`);
        break;
      }
      if (r.traceabilityDisabled) {
        okChain = false;
        lines.push(
          `Traceability disabled at index ${r.index} — chain unverifiable.`
        );
        break;
      }
      if (typeof r.hash !== "string" || typeof r.prevHash !== "string") {
        okChain = false;
        lines.push(
          `Missing hash/prevHash strings at index ${r.index} — chain unverifiable.`
        );
        break;
      }
      if (baselineCommitment && r.policyCommitment !== baselineCommitment) {
        okPolicyBinding = false;
        lines.push(
          `Per-record policyCommitment mismatch at index ${r.index}: ${baselineCommitment.substring(
            0,
            12
          )}… → ${String(r.policyCommitment).substring(0, 12)}…`
        );
      }
      const expected = i === 0 ? "GENESIS" : records[i - 1].hash;
      if (r.prevHash !== expected) {
        okChain = false;
        const prevIdx = i > 0 ? records[i - 1].index : "GENESIS";
        lines.push(`prevHash chain break between ${prevIdx} and ${r.index}.`);
        break;
      }
    }

    // Inspectability only: check presence of evalInput on DECIDE nodes
    const byAction: Record<string, any[]> = {};
    for (const r of records) {
      if (!byAction[r.actionId]) byAction[r.actionId] = [];
      byAction[r.actionId].push(r);
    }
    for (const [actionId, recs] of Object.entries(byAction)) {
      const decide = recs.find((r) => r.nodeType === "DECIDE");
      if (!decide) continue;
      if (!decide.data || !decide.data.evalInput) {
        okInspectability = false;
        lines.push(
          `DECIDE node for ${actionId} missing evalInput — reasoning trace is not fully inspectable in this bundle.`
        );
      }
    }

    const status: VerificationStatus =
      okChain && okPolicyBinding && okInspectability ? "PASS" : "FAIL";
    const details =
      (lines.length ? lines.join("\n") + "\n" : "") +
      "Browser quick check; verifier node is authoritative.";

    return {
      verifiedAtMs,
      status,
      okChain,
      okPolicyBinding,
      details,
    };
  } catch (err: unknown) {
    return {
      verifiedAtMs,
      status: "FAIL",
      okChain: false,
      okPolicyBinding: false,
      details:
        err instanceof Error ? `Client verification error: ${err.message}` : "Client verification error.",
    };
  }
}

function TreatyRuntimeDemoPageContent() {
  const searchParams = useSearchParams();
  const [importedProof, setImportedProof] = useState<ProofBundle | null>(null);
  const [browserVerification, setBrowserVerification] = useState<ProofVerification | null>(null);
  const [serverVerification, setServerVerification] = useState<ServerVerifyResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const param = searchParams.get("import");
    if (!param || !param.startsWith("local:")) return;
    const id = decodeURIComponent(param.slice("local:".length));
    const proof = loadFromRegistry(id);
    if (!proof) {
      setImportError("Imported proof not found in local registry.");
      setImportedProof(null);
      setBrowserVerification(null);
      setServerVerification(null);
      return;
    }
    if (proof.meta.schemaVersion !== "TRT-1.0") {
      setImportError("Imported proof is not a Treaty Runtime (TRT-1.0) proof.");
      setImportedProof(null);
      setBrowserVerification(null);
      setServerVerification(null);
      return;
    }
    setImportError(null);
    setImportedProof(proof);
    setBrowserVerification(null);
    setServerVerification(null);
    // Auto-run browser verification
    verifyTrrClient(proof)
      .then((v) => setBrowserVerification(v))
      .catch(() => {
        setBrowserVerification({
          verifiedAtMs: Date.now(),
          status: "FAIL",
          okChain: false,
          okPolicyBinding: false,
          details: "Browser verification failed for imported proof.",
        });
      });
  }, [searchParams]);

  const handleVerifyServer = async () => {
    if (!importedProof) return;
    try {
      setVerifying(true);
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof: importedProof }),
      });
      const data: ServerVerifyResponse = await res.json();
      if (!res.ok) {
        const msg =
          (data as any)?.error ||
          (Array.isArray(data?.notes) && data.notes.length
            ? data.notes.join("; ")
            : "Server verification failed.");
        throw new Error(msg);
      }
      setServerVerification(data);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Server verification failed.");
      setServerVerification(null);
    } finally {
      setVerifying(false);
    }
  };

  const runStatus: VerificationStatus | null = importedProof?.verification?.status ?? null;
  const browserStatus: VerificationStatus | null = browserVerification?.status ?? null;
  const serverStatus: VerificationStatus | null =
    serverVerification?.verification.status ?? null;
  const agreement = agreementSummary([runStatus, browserStatus, serverStatus]);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: spacing.lg,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <div>
          <Link
            href="/demos"
            style={{ fontSize: text.small, color: "#2563eb", textDecoration: "none" }}
          >
            ← Demos
          </Link>
          <h1
            style={{
              fontSize: text.h1,
              fontWeight: 700,
              marginTop: spacing.xs,
            }}
          >
            Treaty Runtime (flagship)
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: spacing.xs,
          }}
        >
          <Link
            href="/omega/treaty-runtime.html"
            style={{ fontSize: text.small, color: "#2563eb", textDecoration: "none" }}
          >
            Open raw HTML →
          </Link>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 2fr)",
          gap: spacing.lg,
          alignItems: "flex-start",
        }}
      >
        <div>
          {importedProof && (
            <UiCard style={{ marginBottom: spacing.md }}>
              <h2
                style={{
                  fontSize: text.h3,
                  fontWeight: 600,
                  marginBottom: spacing.xs,
                }}
              >
                Imported proof (local)
              </h2>
              <p
                style={{
                  fontSize: text.small,
                  color: "var(--text-muted, #4b5563)",
                  marginBottom: spacing.xs,
                }}
              >
                Schema: {importedProof.meta.schemaVersion} · Records: {importedProof.trace.length}
              </p>
              <p
                style={{
                  fontSize: text.small,
                  color: "var(--text-muted, #4b5563)",
                  marginBottom: spacing.sm,
                }}
              >
                Policy commitment: {importedProof.meta.policyCommitment.slice(0, 12)}…
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: spacing.xs,
                  marginBottom: spacing.sm,
                }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    if (!importedProof) return;
                    const v = await verifyTrrClient(importedProof);
                    setBrowserVerification(v);
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Re-verify in browser
                </button>
                <button
                  type="button"
                  onClick={handleVerifyServer}
                disabled={verifying}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                  cursor: verifying ? "default" : "pointer",
                  opacity: verifying ? 0.7 : 1,
                  }}
                >
                  Verify on verifier node
                </button>
                {verifying && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #6b7280)",
                    }}
                  >
                    Verifying…
                  </span>
                )}
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                  marginBottom: spacing.xs,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 4px 4px 0" }}>Artifact</th>
                    <th style={{ textAlign: "center", padding: "4px 4px" }}>Run</th>
                    <th style={{ textAlign: "center", padding: "4px 4px" }}>Browser</th>
                    <th style={{ textAlign: "center", padding: "4px 4px" }}>Verifier</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 4px 4px 0" }}>Imported proof</td>
                    <td style={{ textAlign: "center", padding: "4px 4px" }}>
                      {statusChip(runStatus)}
                    </td>
                    <td style={{ textAlign: "center", padding: "4px 4px" }}>
                      {statusChip(browserStatus)}
                    </td>
                    <td style={{ textAlign: "center", padding: "4px 4px" }}>
                      {statusChip(serverStatus)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p
                style={{
                  fontSize: 11,
                  color: agreement.agreement ? "#166534" : "#92400e",
                }}
              >
                Agreement:{" "}
                {agreement.agreement ? "YES" : `NO — ${agreement.reason || "mismatch"}`}
              </p>
            </UiCard>
          )}
          {importError && (
            <UiCard style={{ marginBottom: spacing.md, backgroundColor: "#fef2f2" }}>
              <p
                style={{
                  fontSize: text.small,
                  color: "#b91c1c",
                  margin: 0,
                }}
              >
                {importError}
              </p>
            </UiCard>
          )}
          <UiCard>
            <h2
              style={{
                fontSize: text.h2,
                fontWeight: 600,
                marginBottom: spacing.sm,
              }}
            >
              How to read this demo
            </h2>
            <p
              style={{
                fontSize: text.body,
                color: "var(--text-muted, #4b5563)",
                marginBottom: spacing.sm,
              }}
            >
              Treaty Runtime shows a governance-enforced evaluation of a cyber-physical treaty:
              proposals, constraints, reasoning, and traceability — all before execution.
            </p>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: text.body,
                lineHeight: 1.7,
              }}
            >
              <li>
                In the embedded demo on the right, use <strong>Agent actions</strong> in the left
                column to run any scenario.
              </li>
              <li>
                Watch the <strong>Reasoning spine</strong> in the middle column update
                (OBSERVE → DERIVE → ASSUME → DECIDE → ACT).
              </li>
              <li>
                Use <strong>Trace &amp; verifier</strong> in the right column to run{" "}
                <code style={{ fontSize: text.small }}>Verify current trace</code>.
              </li>
              <li>
                Click <code style={{ fontSize: text.small }}>Export trace (JSON)</code> in the
                Trace &amp; verifier panel — this produces a <strong>TRT-1.0 proof bundle</strong>{" "}
                (meta + trace).
              </li>
              <li>
                To verify portably, open{" "}
                <Link href="/proofs" style={{ color: "#2563eb" }}>
                  /proofs
                </Link>{" "}
                and run <strong>Verify on verifier node</strong> on that bundle.
              </li>
            </ol>
          </UiCard>

          <UiCard>
            <h3
              style={{
                fontSize: text.h3,
                fontWeight: 600,
                marginBottom: spacing.sm,
              }}
            >
              Verifier framing
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: text.small,
                lineHeight: 1.7,
              }}
            >
              <li>
                <strong>Proof objects:</strong> hash chain + commitments over treaty evaluations,
                exported as TRT-1.0 bundles (meta + trace).
              </li>
              <li>
                <strong>Irreducibility toggles:</strong> remove governance/reasoning/traceability to
                see precise failure modes.
              </li>
              <li>
                <strong>Replay:</strong> export trace JSON and load it into the{" "}
                <Link href="/proofs" style={{ color: "#2563eb" }}>
                  Proof Objects
                </Link>{" "}
                page to run browser quick checks and verifier-node validation.
              </li>
            </ul>
            <p
              style={{
                marginTop: spacing.sm,
                fontSize: text.small,
                color: "var(--text-muted, #6b7280)",
              }}
            >
              The embedded verifier validates this runtime view; the verifier node (exposed via{" "}
              <code style={{ fontSize: text.small }}>/api/verify</code> and{" "}
              <Link href="/proofs" style={{ color: "#2563eb" }}>
                /proofs
              </Link>
              ) is authoritative across environments. We prove integrity + deterministic evaluation +
              replay. We do not claim to solve covert channels or full multi-agent composition.
            </p>
          </UiCard>
        </div>

        <div>
          <UiCard
            style={{
              padding: 0,
              overflow: "hidden",
            }}
          >
            <iframe
              src="/omega/treaty-runtime.html"
              title="Treaty Runtime demo"
              sandbox="allow-scripts allow-same-origin allow-downloads allow-forms"
              style={{
                border: "none",
                width: "100%",
                height: "calc(100vh - 180px)",
                minHeight: "640px",
                maxHeight: "960px",
              }}
            />
          </UiCard>
        </div>
      </section>
    </div>
  );
}

export default function TreatyRuntimeDemoPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#374151" }}>Loading…</div>}>
      <TreatyRuntimeDemoPageContent />
    </Suspense>
  );
}
