import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

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
  data: any;
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

type VerifyResponse = {
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

function canonicalize(value: unknown): unknown {
  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    throw new Error("Non-canonicalizable value encountered");
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite number in canonicalize");
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

function sha256Hex(str: string): string {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function buildRecordPayload(meta: ProofMeta, rec: Omit<ProofRecord, "hash">) {
  return {
    schemaVersion: meta.schemaVersion,
    index: rec.index,
    tsMs: rec.tsMs,
    type: rec.type,
    prevHash: rec.prevHash,
    policyCommitment: meta.policyCommitment,
    runCommitment: meta.runCommitment,
    data: rec.data,
  };
}

function verifyBundle(
  meta: ProofMeta,
  trace: ProofRecord[],
  hadJson: boolean
): { verification: ProofVerification; badIndex: number | null } {
  const verifiedAtMs = Date.now();
  let badIndex: number | null = null;
  try {
    const recomputedPolicyCommitment = sha256Hex(canonicalJson(meta.policy));
    const okPolicyCommitment = recomputedPolicyCommitment === meta.policyCommitment;
    const recomputedRunCommitment = sha256Hex(
      canonicalJson({
        command: meta.command,
        repoRoot: meta.repoRoot,
        exportedAtMs: meta.exportedAtMs,
        policyCommitment: meta.policyCommitment,
      })
    );
    const okRunCommitment = recomputedRunCommitment === meta.runCommitment;

    let okChain = true;
    for (let i = 0; i < trace.length; i++) {
      const rec = trace[i];
      const expectedPrev = i === 0 ? "GENESIS" : trace[i - 1].hash;
      if (rec.prevHash !== expectedPrev) {
        okChain = false;
        badIndex = i;
        break;
      }
      const payload = buildRecordPayload(meta, {
        index: rec.index,
        tsMs: rec.tsMs,
        type: rec.type,
        prevHash: rec.prevHash,
        data: rec.data,
      });
      const expectedHash = sha256Hex(canonicalJson(payload));
      if (expectedHash !== rec.hash) {
        okChain = false;
        badIndex = i;
        break;
      }
    }

    const okPolicyBinding = okPolicyCommitment && okRunCommitment;
    const okTraceNonTrivial = trace.length >= 2;

    let okSignature: boolean | undefined;
    if (meta.signing?.enabled) {
      try {
        if (!meta.signing.publicKeyPem || !meta.signing.signatureB64) {
          okSignature = false;
        } else {
          const ok = crypto.verify(
            null,
            Buffer.from(meta.runCommitment, "utf8"),
            meta.signing.publicKeyPem,
            Buffer.from(meta.signing.signatureB64, "base64")
          );
          okSignature = ok;
        }
      } catch {
        okSignature = false;
      }
    }

    const requireSignature = !!meta.signing?.enabled;
    const status: ProofVerification["status"] =
      okChain &&
      okPolicyBinding &&
      okTraceNonTrivial &&
      hadJson &&
      (!requireSignature || okSignature) ?
        "PASS" :
        "FAIL";

    const details = [
      `okPolicyCommitment=${okPolicyCommitment}`,
      `okRunCommitment=${okRunCommitment}`,
      `okChain=${okChain}`,
      `hadJson=${hadJson}`,
      `okTraceNonTrivial=${okTraceNonTrivial}`,
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
    }, badIndex;
  } catch (err: unknown) {
    return {
      verifiedAtMs,
      status: "FAIL",
      okChain: false,
      okPolicyBinding: false,
      okSignature: meta.signing?.enabled ? false : undefined,
      details:
        err instanceof Error ? `Verification error: ${err.message}` : "Verification error.",
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<VerifyResponse>> {
  const notes: string[] = [];
  try {
    const MAX_BYTES = 512 * 1024;
    const raw = await req.text();
    if (raw.length > MAX_BYTES) {
      notes.push("Request body too large");
      const verification: ProofVerification = {
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: "Request body too large",
      };
      return NextResponse.json(
        {
          ok: false,
          verification,
          notes,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
        },
        { status: 413 }
      );
    }

    const body = (() => {
      try {
        return raw.length ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();
    if (!body || typeof body !== "object") {
      notes.push("Missing or invalid JSON body");
      const verification: ProofVerification = {
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: "Missing or invalid JSON body",
      };
      return NextResponse.json(
        {
          ok: false,
          verification,
          notes,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
        },
        { status: 400 }
      );
    }

    const proof = (body as any).proof as ProofBundle | undefined;
    if (!proof || !proof.meta || !Array.isArray(proof.trace)) {
      notes.push("Missing proof.meta or proof.trace");
      const verification: ProofVerification = {
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: "Missing proof.meta or proof.trace",
      };
      return NextResponse.json(
        {
          ok: false,
          verification,
          notes,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
        },
        { status: 400 }
      );
    }

    if (proof.meta.schemaVersion !== "RLT-1.0") {
      notes.push(`Unsupported schemaVersion: ${proof.meta.schemaVersion}`);
      const verification: ProofVerification = {
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: `Unsupported schemaVersion: ${proof.meta.schemaVersion}`,
      };
      return NextResponse.json(
        {
          ok: false,
          verification,
          notes,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
        },
        { status: 400 }
      );
    }

    if (proof.meta.hashAlgo !== "SHA-256") {
      notes.push(`Unsupported hashAlgo: ${proof.meta.hashAlgo}`);
      const verification: ProofVerification = {
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: `Unsupported hashAlgo: ${proof.meta.hashAlgo}`,
      };
      return NextResponse.json(
        {
          ok: false,
          verification,
          notes,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
        },
        { status: 400 }
      );
    }

    let hadJson = false;
    for (let i = proof.trace.length - 1; i >= 0; i--) {
      const rec = proof.trace[i];
      if (rec.type === "RUN_END") {
        if (rec.data && typeof rec.data.hadJson === "boolean") {
          hadJson = rec.data.hadJson;
        }
        break;
      }
    }

    if (!hadJson) {
      const summary = proof.trace.find(
        (r) =>
          r.type === "VITEST_SUMMARY" &&
          r.data &&
          typeof r.data === "object" &&
          !("error" in r.data)
      );
      hadJson = !!summary;
    }

    const { verification, badIndex } = verifyBundle(proof.meta, proof.trace, hadJson);
    const ok = verification.status === "PASS";
    const stats = {
      recordCount: proof.trace.length,
      badIndex,
      hadJson,
      signingEnabled: !!proof.meta.signing?.enabled,
    };
    return NextResponse.json({ ok, verification, notes, stats }, { status: 200 });
  } catch (err: any) {
    notes.push("Unexpected error during verification");
    const verification: ProofVerification = {
      verifiedAtMs: Date.now(),
      status: "FAIL",
      okChain: false,
      okPolicyBinding: false,
      details: err instanceof Error ? err.message : "Unexpected error",
    };
    return NextResponse.json(
      {
        ok: false,
        verification,
        notes,
        stats: {
          recordCount: 0,
          badIndex: null,
          hadJson: false,
          signingEnabled: false,
        },
      },
      { status: 500 }
    );
  }
}

