"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import UiCard from "../learning/ui/UiCard";
import { SPACING, TEXT_SIZES } from "../learning/ui/uiTokens";

const spacing = SPACING.standard;
const text = TEXT_SIZES.standard;

type VerificationStatus = "PASS" | "FAIL";

type ProofVerification = {
  verifiedAtMs: number;
  status: VerificationStatus;
  okChain: boolean;
  okPolicyBinding: boolean;
  okDeterminism?: boolean;
  okSignature?: boolean;
  unverifiable?: boolean;
  details: string;
};

type ProofMetaCommon = {
  schemaVersion: string;
  hashAlgo: string;
  policyCommitment?: string;
};

type ProofBundle = {
  meta: ProofMetaCommon & Record<string, any>;
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

function loadRegistry(): RegistryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveRegistry(items: RegistryItem[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(items);
    if (raw.length > 400_000) {
      // best-effort: don’t exceed localStorage too hard
      // eslint-disable-next-line no-console
      console.warn("[proofs] Registry too large; not saving.");
      return;
    }
    window.localStorage.setItem(REGISTRY_KEY, raw);
  } catch {
    // ignore
  }
}

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

async function verifyRltClient(bundle: ProofBundle): Promise<ProofVerification> {
  const verifiedAtMs = Date.now();
  try {
    const meta = bundle.meta;
    const trace = Array.isArray(bundle.trace) ? bundle.trace : [];
    const policyCommitment = await sha256HexBrowser(
      canonicalJson(meta.policy)
    );
    const okPolicyCommitment =
      meta.policyCommitment && meta.policyCommitment === policyCommitment;

    let okChain = true;
    let badIndex: number | null = null;
    for (let i = 0; i < trace.length; i++) {
      const rec = trace[i];
      if (
        typeof rec.index !== "number" ||
        typeof rec.tsMs !== "number" ||
        typeof rec.type !== "string" ||
        typeof rec.prevHash !== "string" ||
        typeof rec.hash !== "string"
      ) {
        okChain = false;
        badIndex = i;
        break;
      }
      if (rec.index !== i) {
        okChain = false;
        badIndex = i;
        break;
      }
      const expectedPrev = i === 0 ? "GENESIS" : trace[i - 1].hash;
      if (rec.prevHash !== expectedPrev) {
        okChain = false;
        badIndex = i;
        break;
      }
      const payload = {
        schemaVersion: meta.schemaVersion,
        index: rec.index,
        tsMs: rec.tsMs,
        type: rec.type,
        prevHash: rec.prevHash,
        policyCommitment: meta.policyCommitment,
        runCommitment: meta.runCommitment,
        data: rec.data,
      };
      const h = await sha256HexBrowser(canonicalJson(payload));
      if (h !== rec.hash) {
        okChain = false;
        badIndex = i;
        break;
      }
    }

    const okPolicyBinding = okPolicyCommitment;
    const okTraceNonTrivial = trace.length >= 2;

    let okSignature: boolean | undefined;
    if (meta.signing?.enabled) {
      if (!meta.signing.publicKeyPem || !meta.signing.signatureB64) {
        okSignature = false;
      } else if (typeof crypto === "undefined" || !crypto.subtle) {
        okSignature = false;
      } else {
        const pem = meta.signing.publicKeyPem;
        const b64 = pem
          .replace(/-----BEGIN PUBLIC KEY-----/g, "")
          .replace(/-----END PUBLIC KEY-----/g, "")
          .replace(/\s+/g, "");
        const raw = atob(b64);
        const der = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) der[i] = raw.charCodeAt(i);
        const key = await crypto.subtle.importKey(
          "spki",
          der,
          { name: "Ed25519" },
          false,
          ["verify"]
        );
        const sigRaw = atob(meta.signing.signatureB64);
        const sig = new Uint8Array(sigRaw.length);
        for (let i = 0; i < sigRaw.length; i++) sig[i] = sigRaw.charCodeAt(i);
        const encoder = new TextEncoder();
        const ok = await crypto.subtle.verify(
          "Ed25519",
          key,
          sig,
          encoder.encode(meta.runCommitment)
        );
        okSignature = ok;
      }
    }

    const requireSignature = !!meta.signing?.enabled;
    const status: VerificationStatus =
      okChain && okPolicyBinding && okTraceNonTrivial && (!requireSignature || okSignature)
        ? "PASS"
        : "FAIL";

    const details = [
      okChain ? "Chain ok" : "Chain invalid",
      okPolicyBinding ? "Policy binding ok" : "Policy binding mismatch",
      `signingEnabled=${!!meta.signing?.enabled}`,
      okSignature !== undefined ? `okSignature=${okSignature}` : null,
      badIndex !== null ? `badIndex=${badIndex}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    return {
      verifiedAtMs,
      status,
      okChain,
      okPolicyBinding,
      okSignature,
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

    // Inspectability (presence of evalInput) only — no determinism replay claim
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

export default function ProofsPage() {
  const [loadedProof, setLoadedProof] = useState<ProofBundle | null>(null);
  const [browserVerification, setBrowserVerification] = useState<ProofVerification | null>(null);
  const [serverVerification, setServerVerification] = useState<ServerVerifyResponse | null>(null);
  const [registry, setRegistry] = useState<RegistryItem[]>(() => loadRegistry());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [jsonModal, setJsonModal] = useState<{ title: string; content: string } | null>(null);
  const router = useRouter();
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || typeof json !== "object" || !json.meta || !Array.isArray(json.trace)) {
        throw new Error("Invalid proof bundle structure");
      }
      setLoadedProof(json);
      setBrowserVerification(null);
      setServerVerification(null);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse proof JSON");
      setLoadedProof(null);
    } finally {
      e.target.value = "";
    }
  };

  const handleVerifyBrowser = async () => {
    if (!loadedProof) return;
    try {
      setBusy(true);
      setError(null);
      const schema = loadedProof.meta.schemaVersion;
      let v: ProofVerification;
      if (schema === "RLT-1.0") v = await verifyRltClient(loadedProof);
      else if (schema === "TRT-1.0") v = await verifyTrrClient(loadedProof);
      else throw new Error(`Unsupported schemaVersion: ${schema}`);
      setBrowserVerification(v);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Browser verify failed");
      setBrowserVerification(null);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyServer = async () => {
    if (!loadedProof) return;
    try {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof: loadedProof }),
      });
      const data: ServerVerifyResponse = await res.json();
      if (!res.ok) {
        const msg =
          (data as any)?.error ||
          (Array.isArray(data?.notes) && data.notes.length
            ? data.notes.join("; ")
            : "Server verify failed");
        throw new Error(msg);
      }
      setServerVerification(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Server verify failed");
      setServerVerification(null);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    if (!loadedProof) return;
    const id = `${loadedProof.meta.schemaVersion}-${Date.now()}`;
    const item: RegistryItem = {
      id,
      savedAtMs: Date.now(),
      schemaVersion: loadedProof.meta.schemaVersion,
      proof: loadedProof,
    };
    const next = [item, ...registry];
    setRegistry(next);
    saveRegistry(next);
  };

  const handleDelete = (id: string) => {
    const next = registry.filter((r) => r.id !== id);
    setRegistry(next);
    saveRegistry(next);
  };

  const schema = loadedProof?.meta.schemaVersion ?? "—";
  const recordCount = loadedProof?.trace?.length ?? 0;
  const runStatus: VerificationStatus | null = loadedProof?.verification?.status ?? null;
  const browserStatus: VerificationStatus | null = browserVerification?.status ?? null;
  const serverStatus: VerificationStatus | null =
    serverVerification?.verification.status ?? null;
  const agreement = agreementSummary([runStatus, browserStatus, serverStatus]);

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: spacing.lg,
      }}
    >
      <header style={{ marginBottom: spacing.lg }}>
        <h1
          style={{
            fontSize: text.h1,
            fontWeight: 700,
            marginBottom: spacing.sm,
          }}
        >
          Proof Objects
        </h1>
        <p
          style={{
            fontSize: text.body,
            color: "var(--text-muted, #4b5563)",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Drop a proof. Verify locally. Verify via verifier node. Store locally. This page bridges
          Treaty Runtime and Research Lab proof objects.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {error && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: "#fee2e2" }}>
          <p style={{ fontSize: text.body, color: "#b91c1c", margin: 0 }}>{error}</p>
        </UiCard>
      )}

      <section style={{ marginBottom: spacing.lg }}>
        <UiCard>
          <h2
            style={{
              fontSize: text.h2,
              fontWeight: 600,
              marginBottom: spacing.sm,
            }}
          >
            Load proof
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: spacing.sm,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "8px 16px",
                fontSize: text.small,
                backgroundColor: "#111827",
                color: "white",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              Select JSON file
            </button>
            {busy && (
              <span style={{ fontSize: text.small, color: "var(--text-muted, #6b7280)" }}>
                Verifying…
              </span>
            )}
          </div>
        </UiCard>
      </section>

      {loadedProof && (
        <section style={{ marginBottom: spacing.lg }}>
          <UiCard id="current-proof">
            <h2
              style={{
                fontSize: text.h2,
                fontWeight: 600,
                marginBottom: spacing.sm,
              }}
            >
              Current proof
            </h2>
            <p
              style={{
                fontSize: text.small,
                color: "var(--text-muted, #4b5563)",
                marginBottom: spacing.sm,
              }}
            >
              Schema: {schema} · Records: {recordCount}
            </p>
            <p
              style={{
                fontSize: text.small,
                color: "var(--text-muted, #4b5563)",
                marginBottom: spacing.sm,
              }}
            >
              Commitments:{" "}
              {schema === "RLT-1.0"
                ? `policy=${loadedProof.meta.policyCommitment?.slice(
                    0,
                    12
                  )}…, run=${loadedProof.meta.runCommitment?.slice(0, 12)}…`
                : schema === "TRT-1.0"
                ? `policy=${loadedProof.meta.policyCommitment?.slice(0, 12)}…`
                : "n/a"}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <button
                type="button"
                onClick={handleVerifyBrowser}
                disabled={busy}
                style={{
                  padding: "8px 16px",
                  fontSize: text.small,
                  backgroundColor: "#1d4ed8",
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                Verify in browser
              </button>
              <button
                type="button"
                onClick={handleVerifyServer}
                disabled={busy}
                style={{
                  padding: "8px 16px",
                  fontSize: text.small,
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                Verify on verifier node
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: "8px 16px",
                  fontSize: text.small,
                  backgroundColor: "#0f766e",
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                Save to local registry
              </button>
            </div>
            <details style={{ fontSize: text.small, marginTop: spacing.sm }}>
              <summary style={{ cursor: "pointer" }}>View proof JSON</summary>
              <pre
                style={{
                  marginTop: spacing.sm,
                  padding: spacing.sm,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  fontSize: 12,
                  maxHeight: 320,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(loadedProof, null, 2)}
              </pre>
            </details>
          </UiCard>

          <UiCard>
            <h3
              style={{
                fontSize: text.h3,
                fontWeight: 600,
                marginBottom: spacing.sm,
              }}
            >
              Agreement
            </h3>
            <p
              style={{
                fontSize: text.small,
                color: "var(--text-muted, #4b5563)",
                marginBottom: spacing.sm,
              }}
            >
              This is the verifier market interface: independent nodes can validate proof objects
              without rerunning vitest.
            </p>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: text.small,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "4px 8px 4px 0" }}>Artifact</th>
                  <th style={{ textAlign: "center", padding: "4px 8px" }}>Run</th>
                  <th style={{ textAlign: "center", padding: "4px 8px" }}>Browser</th>
                  <th style={{ textAlign: "center", padding: "4px 8px" }}>Verifier node</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 8px 6px 0" }}>Loaded proof</td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    {statusChip(runStatus)}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    {statusChip(browserStatus)}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 8px" }}>
                    {statusChip(serverStatus)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              style={{
                fontSize: text.small,
                marginTop: spacing.sm,
                color: agreement.agreement ? "#166534" : "#92400e",
              }}
            >
              Agreement:{" "}
              {agreement.agreement ? "YES" : `NO — ${agreement.reason || "mismatch"}`}
            </p>
          </UiCard>
        </section>
      )}

      <section>
        <UiCard>
          <h2
            style={{
              fontSize: text.h2,
              fontWeight: 600,
              marginBottom: spacing.sm,
            }}
          >
            Local registry
          </h2>
          {registry.length === 0 ? (
            <p
              style={{
                fontSize: text.small,
                color: "var(--text-muted, #6b7280)",
                margin: 0,
              }}
            >
              No saved proofs yet. Save one above after verifying.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                fontSize: text.small,
              }}
            >
              {registry.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid #e5e7eb",
                    gap: spacing.sm,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div>
                      <strong>{item.schemaVersion ?? item.proof.meta.schemaVersion}</strong> ·{" "}
                      {new Date(item.savedAtMs).toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: spacing.xs,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setLoadedProof(item.proof);
                        setBrowserVerification(null);
                        setServerVerification(null);
                        setError(null);
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setJsonModal({
                          title: `Proof ${item.id}`,
                          content: JSON.stringify(item.proof, null, 2),
                        });
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      Open JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const schemaVersion = item.schemaVersion ?? item.proof.meta.schemaVersion;
                        const targetId = item.id;
                        if (schemaVersion === "TRT-1.0") {
                          router.push(
                            `/demos/treaty-runtime?import=local:${encodeURIComponent(targetId)}`
                          );
                        } else if (schemaVersion === "RLT-1.0") {
                          router.push(
                            `/research-lab?import=local:${encodeURIComponent(targetId)}`
                          );
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        backgroundColor: "#f9fafb",
                        cursor: "pointer",
                      }}
                    >
                      Open in context
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setBusy(true);
                          setBrowserVerification(null);
                          setServerVerification(null);
                          setRowBusyId(item.id);
                          setError(null);
                          setLoadedProof(item.proof);
                          document
                            .getElementById("current-proof")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          const schema = item.proof.meta.schemaVersion;
                          let v: ProofVerification;
                          if (schema === "RLT-1.0") {
                            v = await verifyRltClient(item.proof);
                          } else if (schema === "TRT-1.0") {
                            v = await verifyTrrClient(item.proof);
                          } else {
                            throw new Error(`Unsupported schemaVersion: ${schema}`);
                          }
                          setBrowserVerification(v);
                          const res = await fetch("/api/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ proof: item.proof }),
                          });
                          const data: ServerVerifyResponse = await res.json();
                          if (!res.ok) {
                            throw new Error(
                              data?.error ||
                                (Array.isArray(data?.notes) && data.notes.length
                                  ? data.notes.join("; ")
                                  : "Server verify failed")
                            );
                          }
                          setServerVerification(data);
                        } catch (err: unknown) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Verify all (browser + server) failed"
                          );
                        } finally {
                          setBusy(false);
                          setRowBusyId(null);
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRadius: 999,
                        border: "1px solid #1d4ed8",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        cursor: busy || rowBusyId === item.id ? "default" : "pointer",
                        opacity: busy || rowBusyId === item.id ? 0.7 : 1,
                      }}
                      disabled={busy || rowBusyId === item.id}
                    >
                      {rowBusyId === item.id ? "Verifying..." : "Verify all"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        borderRadius: 999,
                        border: "1px solid #fecaca",
                        backgroundColor: "#fef2f2",
                        color: "#b91c1c",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </UiCard>
      </section>
      {jsonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "min(800px, 90vw)",
              maxHeight: "80vh",
              backgroundColor: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(15,23,42,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: text.small,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {jsonModal.title}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(jsonModal.content).catch(() => {
                        // ignore clipboard errors
                      });
                    }
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#f9fafb",
                    cursor: "pointer",
                  }}
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  onClick={() => setJsonModal(null)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: "12px 16px",
                backgroundColor: "#f3f4f6",
                borderRadius: "0 0 12px 12px",
                fontSize: 12,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {jsonModal.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

