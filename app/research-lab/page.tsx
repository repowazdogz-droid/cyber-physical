"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SPACING, TEXT_SIZES } from "../learning/ui/uiTokens";
import UiCard from "../learning/ui/UiCard";

const spacing = SPACING.standard;
const textSizes = TEXT_SIZES.standard;

type ProofMeta = {
  demo: "research-lab";
  schemaVersion: "RLT-1.0";
  hashAlgo: "SHA-256";
  exportedAtMs: number;
  repoRoot: string;
  command: string;
  ci: boolean;
  policy: {
    failClosed: true;
    noNetworkClaims: true;
    trustedReference: "vitest";
  };
  policyCommitment: string;
  runCommitment: string;
  signing?: {
    enabled: boolean;
    algo: "Ed25519";
    publicKeyPem?: string;
    signatureB64?: string;
    signedMessage: "runCommitment";
  };
};

type ProofRecordType = "RUN_START" | "VITEST_SUMMARY" | "FILE_RESULT" | "RUN_END";

type ProofRecord = {
  index: number;
  tsMs: number;
  type: ProofRecordType;
  data: unknown;
  prevHash: string;
  hash: string;
};

type ProofVerification = {
  verifiedAtMs: number;
  status: "PASS" | "FAIL";
  okChain: boolean;
  okPolicyBinding: boolean;
  okSignature?: boolean;
  details: string;
};

type ProofBundle = {
  meta: ProofMeta;
  trace: ProofRecord[];
  verification: ProofVerification;
};

interface RunResult {
  success: boolean;
  exitCode: number;
  totalTests: number;
  passed: number;
  failed: number;
  filesPassed: number;
  filesFailed: number;
  output?: string;
  errorOutput?: string;
  error?: string;
  proof?: ProofBundle;
}

type ServerVerifyResponse = {
  ok: boolean;
  verification: ProofVerification;
  notes: string[];
  stats: {
    recordCount: number;
    badIndex: number | null;
    hadJson: boolean;
    signingEnabled: boolean;
  };
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
    return "";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyProofClient(bundle: ProofBundle): Promise<ProofVerification> {
  const verifiedAtMs = Date.now();
  try {
    const policyCommitment = await sha256HexBrowser(canonicalJson(bundle.meta.policy));
    const okPolicyCommitment = policyCommitment === bundle.meta.policyCommitment;
    const runCommitment = await sha256HexBrowser(
      canonicalJson({
        command: bundle.meta.command,
        repoRoot: bundle.meta.repoRoot,
        exportedAtMs: bundle.meta.exportedAtMs,
        policyCommitment: bundle.meta.policyCommitment,
      })
    );
    const okRunCommitment = runCommitment === bundle.meta.runCommitment;

    let okChain = true;
    for (let i = 0; i < bundle.trace.length; i++) {
      const rec = bundle.trace[i];
      const expectedPrev = i === 0 ? "GENESIS" : bundle.trace[i - 1].hash;
      if (rec.prevHash !== expectedPrev) {
        okChain = false;
        break;
      }
      const payload = {
        schemaVersion: bundle.meta.schemaVersion,
        index: rec.index,
        tsMs: rec.tsMs,
        type: rec.type,
        prevHash: rec.prevHash,
        policyCommitment: bundle.meta.policyCommitment,
        runCommitment: bundle.meta.runCommitment,
        data: rec.data,
      };
      const hash = await sha256HexBrowser(canonicalJson(payload));
      if (hash !== rec.hash) {
        okChain = false;
        break;
      }
    }

    const okPolicyBinding = okPolicyCommitment && okRunCommitment;

    let okSignature: boolean | undefined;
    if (bundle.meta.signing?.enabled) {
      try {
        if (!bundle.meta.signing.publicKeyPem || !bundle.meta.signing.signatureB64) {
          okSignature = false;
        } else if (typeof crypto === "undefined" || !crypto.subtle) {
          okSignature = false;
          return {
            verifiedAtMs,
            status: "FAIL",
            okChain,
            okPolicyBinding,
            okSignature,
            details:
              "Signature (browser): unsupported in this environment; integrity only can be checked.",
          };
        } else {
          const pem = bundle.meta.signing.publicKeyPem;
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

          const sigRaw = atob(bundle.meta.signing.signatureB64);
          const sig = new Uint8Array(sigRaw.length);
          for (let i = 0; i < sigRaw.length; i++) sig[i] = sigRaw.charCodeAt(i);

          const encoder = new TextEncoder();
          const ok = await crypto.subtle.verify(
            "Ed25519",
            key,
            sig,
            encoder.encode(bundle.meta.runCommitment)
          );
          okSignature = ok;
        }
      } catch (err) {
        okSignature = false;
        return {
          verifiedAtMs,
          status: "FAIL",
          okChain,
          okPolicyBinding,
          okSignature,
          details:
            err instanceof Error
              ? `Signature verification error (browser): ${err.message}`
              : "Signature verification error (browser).",
        };
      }
    }

    const requireSignature = !!bundle.meta.signing?.enabled;
    const status: ProofVerification["status"] =
      okChain && okPolicyBinding && (!requireSignature || okSignature) ? "PASS" : "FAIL";
    const details = [
      okChain ? "Chain ok" : "Chain invalid",
      okPolicyBinding ? "Policy/run commitments ok" : "Policy/run commitments mismatch",
      `signingEnabled=${!!bundle.meta.signing?.enabled}`,
      okSignature !== undefined ? `okSignature=${okSignature}` : null,
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

function ResearchLabPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [proof, setProof] = useState<ProofBundle | null>(null);
  const [clientVerification, setClientVerification] = useState<ProofVerification | null>(null);
  const [importedProof, setImportedProof] = useState<ProofBundle | null>(null);
  const [importedVerification, setImportedVerification] = useState<ProofVerification | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [serverVerifyCurrent, setServerVerifyCurrent] = useState<ServerVerifyResponse | null>(null);
  const [serverVerifyImported, setServerVerifyImported] = useState<ServerVerifyResponse | null>(null);
  const [serverVerifyError, setServerVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get("import");
    if (!param || !param.startsWith("local:")) return;
    const id = decodeURIComponent(param.slice("local:".length));
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(REGISTRY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RegistryItem[] | any;
      if (!Array.isArray(parsed)) return;
      const entry = (parsed as any[]).find((x) => x && x.id === id);
      if (!entry || !entry.proof) return;
      const proof = entry.proof as ProofBundle;
      if (proof.meta.schemaVersion !== "RLT-1.0") {
        setImportedProof(null);
        setImportedVerification({
          verifiedAtMs: Date.now(),
          status: "FAIL",
          okChain: false,
          okPolicyBinding: false,
          details: "Imported proof is not an RLT-1.0 Research Lab proof.",
        });
        return;
      }
      setImportedProof(proof);
      verifyProofClient(proof)
        .then((v) => setImportedVerification(v))
        .catch(() => {
          setImportedVerification({
            verifiedAtMs: Date.now(),
            status: "FAIL",
            okChain: false,
            okPolicyBinding: false,
            details: "Browser verification failed for imported proof.",
          });
        });
    } catch {
      setImportedProof(null);
      setImportedVerification({
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: "Failed to load imported proof from local registry.",
      });
    }
  }, [searchParams]);

  const handleRunTests = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProof(null);
    setClientVerification(null);
    setImportedProof(null);
    setImportedVerification(null);
    setServerVerifyCurrent(null);
    setServerVerifyImported(null);
    setServerVerifyError(null);

    try {
      const res = await fetch("/api/research-lab/run", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Run failed");
      }

      setResult(data);
      if (data.proof) {
        setProof(data.proof);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to run tests");
    } finally {
      setLoading(false);
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText("npm run test:research-lab");
  };

  const handleDownloadProof = () => {
    if (!proof) return;
    const blob = new Blob([JSON.stringify(proof, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omega-research-lab-proof.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyProof = async () => {
    if (!proof) return;
    const v = await verifyProofClient(proof);
    setClientVerification(v);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as ProofBundle;
      setImportedProof(json);
      const v = await verifyProofClient(json);
      setImportedVerification(v);
    } catch (err: unknown) {
      setImportedProof(null);
      setImportedVerification({
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details:
          err instanceof Error ? `Import error: ${err.message}` : "Import error.",
      });
    } finally {
      e.target.value = "";
    }
  };

  const verifyOnServer = async (bundle: ProofBundle): Promise<ServerVerifyResponse> => {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof: bundle }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Server verify failed");
    }
    return data as ServerVerifyResponse;
  };

  const importedMismatchWarning =
    proof &&
    importedVerification &&
    proof.verification.status !== importedVerification.status;

  const directMismatchWarning =
    proof &&
    clientVerification &&
    proof.verification.status !== clientVerification.status;

  const serverMismatchCurrent =
    proof &&
    serverVerifyCurrent &&
    (proof.verification.status !== serverVerifyCurrent.verification.status ||
      (clientVerification && clientVerification.status !== serverVerifyCurrent.verification.status));

  const serverMismatchImported =
    importedProof &&
    serverVerifyImported &&
    (importedProof.verification.status !== serverVerifyImported.verification.status ||
      (importedVerification && importedVerification.status !== serverVerifyImported.verification.status));

  return (
    <div style={{ padding: spacing.lg, maxWidth: 900, margin: "0 auto" }}>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.lg,
        }}
      >
        <h1 style={{ fontSize: textSizes.heading, fontWeight: 700, margin: 0 }}>
          Research Lab
        </h1>
        <Link
          href="/"
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid var(--border-default, #d0d7de)",
            backgroundColor: "white",
            color: "var(--text-default, #24292f)",
            textDecoration: "none",
            fontSize: textSizes.small,
          }}
        >
          ← Home
        </Link>
      </div>

      <p
        style={{
          fontSize: textSizes.body,
          color: "var(--text-muted, #57606a)",
          marginBottom: spacing.lg,
          lineHeight: 1.5,
        }}
      >
        Autonomous research governance runtime (Clearpath CAP-1.0). Run the suite below or in your
        terminal.
      </p>

      {/* Run tests — same treatment as Demo Console */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: textSizes.h2, fontWeight: 600, marginBottom: spacing.sm }}>
          Run tests
        </h2>
        <p
          style={{
            fontSize: textSizes.small,
            color: "var(--text-muted)",
            marginBottom: spacing.md,
          }}
        >
          Runs all 27 research-lab tests (governance, scaling trap, tamper, claim lifecycle,
          irreducibility, adversarial).
        </p>
        <button
          onClick={handleRunTests}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: textSizes.h3,
            fontWeight: 600,
            backgroundColor: loading ? "#94a3b8" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Running…" : "Run tests"}
        </button>
      </UiCard>

      {/* Result status */}
      {result && (
        <UiCard
          style={{
            marginBottom: spacing.lg,
            backgroundColor: result.success ? "#e8f5e9" : "#ffebee",
            borderColor: result.success ? "#4caf50" : "#d32f2f",
          }}
        >
          <div style={{ fontSize: textSizes.h3, fontWeight: 600, marginBottom: spacing.xs }}>
            {result.success ? "All tests passed" : "Some tests failed"}
          </div>
          <div style={{ fontSize: textSizes.small, opacity: 0.9 }}>
            {result.passed}/{result.totalTests} tests passed
            {result.filesFailed > 0 && ` · ${result.filesFailed} file(s) failed`}
          </div>
          {result.output && (
            <>
              <button
                type="button"
                onClick={() => setShowOutput(!showOutput)}
                style={{
                  marginTop: spacing.sm,
                  padding: "4px 8px",
                  fontSize: 12,
                  background: "transparent",
                  border: "1px solid currentColor",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {showOutput ? "Hide output" : "Show output"}
              </button>
              {showOutput && (
                <pre
                  style={{
                    marginTop: spacing.sm,
                    padding: spacing.sm,
                    background: "rgba(0,0,0,0.05)",
                    borderRadius: 6,
                    fontSize: 12,
                    overflow: "auto",
                    maxHeight: 320,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {result.output}
                </pre>
              )}
            </>
          )}
        </UiCard>
      )}

      {error && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: "#ffebee" }}>
          <p style={{ fontSize: textSizes.body, color: "#d32f2f", margin: 0 }}>{error}</p>
        </UiCard>
      )}

      {serverVerifyError && (
        <UiCard style={{ marginBottom: spacing.lg, backgroundColor: "#ffebee" }}>
          <p style={{ fontSize: textSizes.body, color: "#b91c1c", margin: 0 }}>
            Server verifier error: {serverVerifyError}
          </p>
        </UiCard>
      )}

      {/* Proof Object */}
      {proof && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <h2 style={{ fontSize: textSizes.h2, fontWeight: 600, marginBottom: spacing.sm }}>
            Proof Object (RLT-1.0)
          </h2>
          <p style={{ fontSize: textSizes.small, color: "var(--text-muted)", marginBottom: spacing.sm }}>
            Canonical JSON bundle with hash-chained events, policy commitment, run commitment, and
            verifier output.
          </p>
          <p style={{ fontSize: textSizes.small, color: "var(--text-muted)", marginBottom: spacing.sm }}>
            Hash chain + commitments provide integrity; optional Ed25519 signature authenticates the
            producing runtime.
          </p>
        <p style={{ fontSize: textSizes.small, color: "var(--text-muted)", marginBottom: spacing.sm }}>
          Producer emits a proof. Browser verifies locally. Verifier node verifies independently.
        </p>
          <div style={{ fontSize: textSizes.small, marginBottom: spacing.sm }}>
            <div>
              <strong>Schema:</strong> {proof.meta.schemaVersion}
            </div>
            <div>
              <strong>Policy commitment:</strong>{" "}
              {proof.meta.policyCommitment.slice(0, 16)}…
            </div>
            <div>
              <strong>Run commitment:</strong> {proof.meta.runCommitment.slice(0, 16)}…
            </div>
            <div>
              <strong>Records:</strong> {proof.trace.length}
            </div>
            <div>
              <strong>Exported at:</strong>{" "}
              {new Date(proof.meta.exportedAtMs).toLocaleString()}
            </div>
            <div>
              <strong>Signature:</strong>{" "}
              {proof.meta.signing?.enabled
                ? "present (Ed25519)"
                : "not present (integrity only)"}
            </div>
            <div>
              <strong>Server verification:</strong>{" "}
              {proof.verification.status} (chain:{" "}
              {proof.verification.okChain ? "ok" : "fail"}, policy-binding:{" "}
              {proof.verification.okPolicyBinding ? "ok" : "fail"})
            </div>
          </div>
          {clientVerification && (
            <div
              style={{
                fontSize: textSizes.small,
                marginTop: spacing.xs,
                color: clientVerification.status === "PASS" ? "#15803d" : "#b91c1c",
              }}
            >
              Browser verification: {clientVerification.status} — {clientVerification.details}
            </div>
          )}
          {serverVerifyCurrent && (
            <div
              style={{
                fontSize: textSizes.small,
                marginTop: spacing.xs,
                color: serverVerifyCurrent.verification.status === "PASS" ? "#15803d" : "#b91c1c",
              }}
            >
              Verifier node (server): {serverVerifyCurrent.verification.status} —{" "}
              {serverVerifyCurrent.verification.details}
              {typeof serverVerifyCurrent.verification.okSignature === "boolean" && (
                <> (signature: {serverVerifyCurrent.verification.okSignature ? "ok" : "fail"})</>
              )}
            </div>
          )}
          {directMismatchWarning && (
            <div
              style={{
                marginTop: spacing.sm,
                fontSize: textSizes.small,
                backgroundColor: "#fef3c7",
                borderRadius: 6,
                padding: "8px 10px",
                color: "#92400e",
              }}
            >
              Mismatch: server and client verification disagree. Treat proofs as untrusted unless
              replayed.
            </div>
          )}
          {serverMismatchCurrent && (
            <div
              style={{
                marginTop: spacing.sm,
                fontSize: textSizes.small,
                backgroundColor: "#fef3c7",
                borderRadius: 6,
                padding: "8px 10px",
                color: "#92400e",
              }}
            >
              Mismatch: verifier node disagrees with this environment. Treat proof as untrusted
              unless replayed.
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            <button
              type="button"
              onClick={handleDownloadProof}
              style={{
                padding: "8px 16px",
                fontSize: textSizes.small,
                backgroundColor: "#0f766e",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Download proof JSON
            </button>
            <button
              type="button"
              onClick={handleVerifyProof}
              style={{
                padding: "8px 16px",
                fontSize: textSizes.small,
                backgroundColor: "#1d4ed8",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Re-verify in browser
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              style={{
                padding: "8px 16px",
                fontSize: textSizes.small,
                backgroundColor: "#f97316",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Import proof JSON
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!proof) return;
                try {
                  setServerVerifyError(null);
                  const v = await verifyOnServer(proof);
                  setServerVerifyCurrent(v);
                } catch (err: unknown) {
                  setServerVerifyError(
                    err instanceof Error ? err.message : "Server verify failed"
                  );
                }
              }}
              style={{
                padding: "8px 16px",
                fontSize: textSizes.small,
                backgroundColor: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Verify on server (verifier node)
            </button>
          </div>
          <details style={{ marginTop: spacing.md, fontSize: textSizes.small }}>
            <summary style={{ cursor: "pointer" }}>View proof JSON</summary>
            <pre
              style={{
                marginTop: spacing.sm,
                padding: spacing.sm,
                background: "rgba(0,0,0,0.04)",
                borderRadius: 6,
                fontSize: 12,
                maxHeight: 320,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(proof, null, 2)}
            </pre>
          </details>
        </UiCard>
      )}

      {/* Imported proof verification */}
      {importedProof && (
        <UiCard style={{ marginBottom: spacing.lg }}>
          <h2 style={{ fontSize: textSizes.h2, fontWeight: 600, marginBottom: spacing.sm }}>
            Imported proof
          </h2>
          <div style={{ fontSize: textSizes.small, marginBottom: spacing.sm }}>
            <div>
              <strong>Schema:</strong> {importedProof.meta.schemaVersion}
            </div>
            <div>
              <strong>Records:</strong> {importedProof.trace.length}
            </div>
          </div>
          {importedVerification && (
            <div
              style={{
                fontSize: textSizes.small,
                color: importedVerification.status === "PASS" ? "#15803d" : "#b91c1c",
              }}
            >
              Browser verification (imported): {importedVerification.status} —{" "}
              {importedVerification.details}
            </div>
          )}
          {importedMismatchWarning && (
            <div
              style={{
                marginTop: spacing.sm,
                fontSize: textSizes.small,
                color: "#92400e",
                backgroundColor: "#fef3c7",
                borderRadius: 6,
                padding: "8px 10px",
              }}
            >
              Mismatch: server and imported verification disagree. Treat imported proofs as
              untrusted unless replayed.
            </div>
          )}
          {serverVerifyImported && (
            <div
              style={{
                fontSize: textSizes.small,
                marginTop: spacing.xs,
                color: serverVerifyImported.verification.status === "PASS" ? "#15803d" : "#b91c1c",
              }}
            >
              Verifier node (server, imported): {serverVerifyImported.verification.status} —{" "}
              {serverVerifyImported.verification.details}
              {typeof serverVerifyImported.verification.okSignature === "boolean" && (
                <> (signature: {serverVerifyImported.verification.okSignature ? "ok" : "fail"})</>
              )}
            </div>
          )}
          {serverMismatchImported && (
            <div
              style={{
                marginTop: spacing.sm,
                fontSize: textSizes.small,
                backgroundColor: "#fef3c7",
                borderRadius: 6,
                padding: "8px 10px",
                color: "#92400e",
              }}
            >
              Mismatch: verifier node disagrees with this environment. Treat proof as untrusted
              unless replayed.
            </div>
          )}
        </UiCard>
      )}

      {/* Run in terminal */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: textSizes.h2, fontWeight: 600, marginBottom: spacing.sm }}>
          Run in terminal
        </h2>
        <p
          style={{
            fontSize: textSizes.small,
            color: "var(--text-muted)",
            marginBottom: spacing.sm,
          }}
        >
          From the project root:
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            flexWrap: "wrap",
          }}
        >
          <pre
            style={{
              flex: 1,
              minWidth: 200,
              margin: 0,
              padding: "12px 16px",
              background: "var(--bg-elevated, #f5f6f7)",
              border: "1px solid var(--border-subtle, #e1e4e8)",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            npm run test:research-lab
          </pre>
          <button
            type="button"
            onClick={copyCommand}
            style={{
              padding: "8px 16px",
              fontSize: textSizes.small,
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Copy
          </button>
        </div>
        <p
          style={{
            fontSize: textSizes.small,
            color: "var(--text-muted)",
            marginTop: spacing.sm,
          }}
        >
          Deterministic replay: re-run the exact command in{" "}
          <code>{proof?.meta.command ?? "npx vitest run src/research-lab --reporter=json"}</code>{" "}
          from the repo root and compare PASS/FAIL + file list to the proof object.
        </p>
      </UiCard>

      {/* What this proves */}
      <UiCard style={{ marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: textSizes.h2, fontWeight: 600, marginBottom: spacing.sm }}>
          What this proves
        </h2>
        <p style={{ fontSize: textSizes.body, marginBottom: spacing.sm }}>
          Three primitives are independently necessary. Removing any one produces a specific failure:
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: textSizes.small }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ textAlign: "left", padding: "8px 12px 8px 0", color: "var(--text-muted)" }}>
                Primitive removed
              </th>
              <th style={{ textAlign: "left", padding: "8px 0", color: "var(--text-muted)" }}>
                Failure mode
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <td style={{ padding: "10px 12px 10px 0" }}>Governance</td>
              <td style={{ padding: "10px 0" }}>Bad proposals execute unchecked</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <td style={{ padding: "10px 12px 10px 0" }}>Reasoning</td>
              <td style={{ padding: "10px 0" }}>Decisions are opaque and uninspectable</td>
            </tr>
            <tr>
              <td style={{ padding: "10px 12px 10px 0" }}>Traceability</td>
              <td style={{ padding: "10px 0" }}>History can be tampered with undetectably</td>
            </tr>
          </tbody>
        </table>
      </UiCard>

      {/* Architecture */}
      <UiCard>
        <h2 style={{ fontSize: textSizes.h2, fontWeight: 600, marginBottom: spacing.sm }}>
          Architecture
        </h2>
        <ul
          style={{
            fontSize: textSizes.body,
            margin: 0,
            paddingLeft: 20,
            lineHeight: 1.7,
          }}
        >
          <li>
            <strong>Governance engine:</strong> Policy-based constraint evaluation (scaling,
            baseline, determinism)
          </li>
          <li>
            <strong>Reasoning graph:</strong> Clearpath trace (OBSERVE → DERIVE → ASSUME → DECIDE →
            ACT)
          </li>
          <li>
            <strong>JSONL registry:</strong> Append-only, hash-chained record store
          </li>
          <li>
            <strong>Irreducibility toggles:</strong> Runtime config to disable any primitive
          </li>
        </ul>
        <p style={{ fontSize: textSizes.small, color: "var(--text-muted)", marginTop: spacing.sm }}>
          All hashing and verification reuse Clearpath (CAP-1.0). No new cryptographic
          implementations.
        </p>
      </UiCard>
    </div>
  );
}

export default function ResearchLabPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#374151" }}>Loading…</div>}>
      <ResearchLabPageContent />
    </Suspense>
  );
}
