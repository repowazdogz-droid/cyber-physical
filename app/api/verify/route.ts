import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type RltProofMeta = {
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

type RltProofRecordType = "RUN_START" | "VITEST_SUMMARY" | "FILE_RESULT" | "RUN_END";

type RltProofRecord = {
  index: number;
  tsMs: number;
  type: RltProofRecordType;
  data: any;
  prevHash: string;
  hash: string;
};

type TrrProofMeta = {
  demo: "treaty-runtime";
  schemaVersion: "TRT-1.0";
  hashAlgo: "SHA-256";
  policy: any;
  policyCommitment: string;
  initialState?: any;
};

type TrrProofRecord = {
  schemaVersion: "TRT-1.0";
  recordVersion: string;
  index: number;
  nodeType: string;
  actor: string;
  actionId: string;
  timestampMs: number;
  prevHash: string | null;
  policyCommitment: string;
  insecureByDesign: boolean;
  primitives: {
    governance: boolean;
    reasoning: boolean;
    traceability: boolean;
    [k: string]: any;
  };
  data: any;
  hash?: string | null;
  traceabilityDisabled?: boolean;
};

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

type VerifyResponse = {
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

function buildRltRecordPayload(meta: RltProofMeta, rec: Omit<RltProofRecord, "hash">) {
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

function verifyRltBundle(
  meta: RltProofMeta,
  trace: RltProofRecord[],
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
      const payload = buildRltRecordPayload(meta, {
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
    const status: VerificationStatus =
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
      verification: {
        verifiedAtMs,
        status,
        okChain,
        okPolicyBinding,
        okSignature,
        details,
      },
      badIndex,
    };
  } catch (err: unknown) {
    return {
      verification: {
        verifiedAtMs,
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        okSignature: meta.signing?.enabled ? false : undefined,
        details:
          err instanceof Error ? `Verification error: ${err.message}` : "Verification error.",
      },
      badIndex,
    };
  }
}

function buildTrrHashedRecordPayload(r: TrrProofRecord) {
  return {
    schemaVersion: r.schemaVersion,
    recordVersion: r.recordVersion,
    index: r.index,
    nodeType: r.nodeType,
    actor: r.actor,
    actionId: r.actionId,
    timestampMs: r.timestampMs,
    prevHash: r.prevHash,
    policyCommitment: r.policyCommitment,
    insecureByDesign: r.insecureByDesign,
    primitives: r.primitives,
    data: r.data,
  };
}

async function verifyTrrBundle(
  meta: TrrProofMeta,
  records: TrrProofRecord[]
): Promise<{ verification: ProofVerification; badIndex: number | null }> {
  const verifiedAtMs = Date.now();
  const lines: string[] = [];
  let okChain = true;
  let okDeterminism = true;
  let okPolicyBinding = true;
  let unverifiable = false;
  let okInspectability = true;
  let badIndex: number | null = null;

  try {
    if (meta.schemaVersion && meta.schemaVersion !== "TRT-1.0") {
      lines.push(
        `Unsupported schemaVersion: ${meta.schemaVersion} (expected TRT-1.0).`
      );
      okChain = false;
      return {
        verification: {
          verifiedAtMs,
          status: "FAIL",
          okChain,
          okPolicyBinding,
          okDeterminism,
          unverifiable,
          details: lines.join("\n"),
        },
        badIndex,
      };
    }
    if (meta.hashAlgo && meta.hashAlgo !== "SHA-256") {
      lines.push(
        `Unsupported hashAlgo: ${meta.hashAlgo} (expected SHA-256).`
      );
      okChain = false;
      return {
        verification: {
          verifiedAtMs,
          status: "FAIL",
          okChain,
          okPolicyBinding,
          okDeterminism,
          unverifiable,
          details: lines.join("\n"),
        },
        badIndex,
      };
    }

    const recomputedCommitment = sha256Hex(canonicalJson(meta.policy));
    if (meta.policyCommitment && meta.policyCommitment !== recomputedCommitment) {
      lines.push(
        `Policy commitment mismatch: recorded=${meta.policyCommitment.substring(
          0,
          16
        )}…, recomputed=${recomputedCommitment.substring(0, 16)}…`
      );
      okPolicyBinding = false;
    } else {
      lines.push("Policy commitment matches canonical(policy).");
    }

    let expectedPrev = "GENESIS";
    let firstUnverifiableIndex: number | null = null;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.index !== i) {
        okChain = false;
        badIndex = i;
        break;
      }
      if (r.traceabilityDisabled || !r.hash) {
        if (firstUnverifiableIndex === null) firstUnverifiableIndex = r.index;
        unverifiable = true;
        okChain = false;
        break;
      }
      const payload = buildTrrHashedRecordPayload(r);
      const canon = canonicalJson(payload);
      const h = sha256Hex(canon);
      if (h !== r.hash) {
        lines.push(
          `Hash mismatch at index ${r.index} — stored hash does not match recomputed canonical encoding.`
        );
        okChain = false;
        badIndex = i;
        break;
      }
      if (r.prevHash !== expectedPrev && i !== 0) {
        const prevIdx = i > 0 ? records[i - 1].index : "GENESIS";
        lines.push(`prevHash chain break between ${prevIdx} and ${r.index}.`);
        okChain = false;
        badIndex = i;
        break;
      }
      expectedPrev = r.hash || expectedPrev;
    }

    if (unverifiable && firstUnverifiableIndex !== null) {
      lines.push(
        `Chain integrity UNVERIFIABLE from index ${firstUnverifiableIndex} onward — traceability disabled or hashes missing.`
      );
    } else if (okChain) {
      lines.push(`Hash chain intact across ${records.length} records.`);
    }

    if (meta.policyCommitment) {
      let baseline = meta.policyCommitment;
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        if (typeof r.policyCommitment !== "string") {
          lines.push(`Missing policyCommitment at index ${r.index}.`);
          okPolicyBinding = false;
          break;
        }
        if (r.policyCommitment !== baseline) {
          lines.push(
            `Policy commitment changed at index ${r.index}: ${baseline.substring(
              0,
              12
            )}… → ${r.policyCommitment.substring(0, 12)}…`
          );
          okPolicyBinding = false;
          baseline = r.policyCommitment;
        }
      }
    }

    const byAction: Record<string, TrrProofRecord[]> = {};
    for (const r of records) {
      if (!byAction[r.actionId]) byAction[r.actionId] = [];
      byAction[r.actionId].push(r);
    }

    for (const [actionId, recs] of Object.entries(byAction)) {
      const decide = recs.find((r) => r.nodeType === "DECIDE");
      if (!decide) continue;
      if (decide.data && decide.data.reasoningMissing) {
        lines.push(
          `Reasoning missing for actionId ${actionId} (OBSERVE/DERIVE/ASSUME absent at record index ${decide.index}).`
        );
        okInspectability = false;
      }
      if (!decide.data || !decide.data.evalInput) {
        lines.push(
          `DECIDE node for ${actionId} missing evalInput — reasoning primitive likely disabled.`
        );
        okDeterminism = false;
        break;
      }
      // We do not reimplement full evaluateDeterministic here; treat absence as determinism failure.
      // For security, any mismatch or missing evalInput marks okDeterminism=false.
    }

    const status: VerificationStatus =
      okChain && okPolicyBinding && okDeterminism ? "PASS" : "FAIL";
    const details = lines.join("\n");

    return {
      verification: {
        verifiedAtMs,
        status,
        okChain,
        okPolicyBinding,
        okDeterminism,
        unverifiable,
        details,
      },
      badIndex,
    };
  } catch (err: any) {
    lines.push(`Verification error: ${err?.message || String(err)}`);
    return {
      verification: {
        verifiedAtMs,
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        okDeterminism: false,
        unverifiable,
        details: lines.join("\n"),
      },
      badIndex,
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<VerifyResponse>> {
  const notes: string[] = [];
  const MAX_BYTES = 512 * 1024;

  try {
    const raw = await req.text();
    if (raw.length > MAX_BYTES) {
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
          schemaVersion: "unknown",
          verification,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
          notes: ["Request body too large"],
        },
        { status: 413 }
      );
    }

    let body: any = null;
    try {
      body = raw.length ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }
    if (!body || typeof body !== "object") {
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
          schemaVersion: "unknown",
          verification,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
          notes: ["Missing or invalid JSON body"],
        },
        { status: 400 }
      );
    }

    const proof = (body as any).proof;
    if (!proof || !proof.meta) {
      const verification: ProofVerification = {
        verifiedAtMs: Date.now(),
        status: "FAIL",
        okChain: false,
        okPolicyBinding: false,
        details: "Missing proof.meta",
      };
      return NextResponse.json(
        {
          ok: false,
          schemaVersion: "unknown",
          verification,
          stats: {
            recordCount: 0,
            badIndex: null,
            hadJson: false,
            signingEnabled: false,
          },
          notes: ["Missing proof.meta"],
        },
        { status: 400 }
      );
    }

    const schemaVersion = proof.meta.schemaVersion as string;
    if (schemaVersion === "RLT-1.0") {
      const meta = proof.meta as RltProofMeta;
      const trace = proof.trace as RltProofRecord[] | undefined;
      if (!Array.isArray(trace)) {
        const verification: ProofVerification = {
          verifiedAtMs: Date.now(),
          status: "FAIL",
          okChain: false,
          okPolicyBinding: false,
          details: "Missing trace array for RLT-1.0",
        };
        return NextResponse.json(
          {
            ok: false,
            schemaVersion,
            verification,
            stats: {
              recordCount: 0,
              badIndex: null,
              hadJson: false,
              signingEnabled: !!meta.signing?.enabled,
            },
            notes: ["Missing trace"],
          },
          { status: 200 }
        );
      }

      let hadJson = false;
      for (let i = trace.length - 1; i >= 0; i--) {
        const rec = trace[i];
        if (rec.type === "RUN_END") {
          if (rec.data && typeof rec.data.hadJson === "boolean") {
            hadJson = rec.data.hadJson;
          }
          break;
        }
      }
      if (!hadJson) {
        const summary = trace.find(
          (r) =>
            r.type === "VITEST_SUMMARY" &&
            r.data &&
            typeof r.data === "object" &&
            !("error" in r.data)
        );
        hadJson = !!summary;
      }

      const { verification, badIndex } = verifyRltBundle(meta, trace, hadJson);
      const ok = verification.status === "PASS";
      return NextResponse.json(
        {
          ok,
          schemaVersion,
          verification,
          stats: {
            recordCount: trace.length,
            badIndex,
            hadJson,
            signingEnabled: !!meta.signing?.enabled,
          },
          notes,
        },
        { status: 200 }
      );
    }

    if (schemaVersion === "TRT-1.0") {
      const meta = proof.meta as TrrProofMeta;
      const trace = proof.trace as TrrProofRecord[] | undefined;
      if (!Array.isArray(trace)) {
        const verification: ProofVerification = {
          verifiedAtMs: Date.now(),
          status: "FAIL",
          okChain: false,
          okPolicyBinding: false,
          details: "Missing trace array for TRT-1.0",
        };
        return NextResponse.json(
          {
            ok: false,
            schemaVersion,
            verification,
            stats: {
              recordCount: 0,
              badIndex: null,
              hadJson: undefined,
              signingEnabled: undefined,
            },
            notes: ["Missing trace"],
          },
          { status: 200 }
        );
      }

      const { verification, badIndex } = await verifyTrrBundle(meta, trace);
      const ok = verification.status === "PASS";
      return NextResponse.json(
        {
          ok,
          schemaVersion,
          verification,
          stats: {
            recordCount: trace.length,
            badIndex,
            hadJson: undefined,
            signingEnabled: undefined,
          },
          notes,
        },
        { status: 200 }
      );
    }

    const verification: ProofVerification = {
      verifiedAtMs: Date.now(),
      status: "FAIL",
      okChain: false,
      okPolicyBinding: false,
      details: `Unsupported schemaVersion: ${schemaVersion}`,
    };
    return NextResponse.json(
      {
        ok: false,
        schemaVersion,
        verification,
        stats: {
          recordCount: 0,
          badIndex: null,
          hadJson: undefined,
          signingEnabled: undefined,
        },
        notes: [`Unsupported schemaVersion: ${schemaVersion}`],
      },
      { status: 400 }
    );
  } catch (err: any) {
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
        schemaVersion: "unknown",
        verification,
        stats: {
          recordCount: 0,
          badIndex: null,
          hadJson: undefined,
          signingEnabled: undefined,
        },
        notes: ["Unexpected error during verification"],
      },
      { status: 500 }
    );
  }
}

