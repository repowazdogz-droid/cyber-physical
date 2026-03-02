/**
 * Research Lab — run test suite and return results + proof object.
 * Spawns `vitest run src/research-lab --reporter=json` and builds a CAP-style trace.
 */

import { NextResponse } from "next/server";
import { spawn } from "child_process";
import crypto from "crypto";

export const runtime = "nodejs";

const PROJECT_ROOT = process.cwd();

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

// --- Canonical JSON + SHA-256 helpers ---

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
    if (typeof v === "undefined") {
      continue;
    }
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

// --- Proof utilities ---

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

function buildMeta(command: string): ProofMeta {
  const exportedAtMs = Date.now();
  const policy: ProofMeta["policy"] = {
    failClosed: true,
    noNetworkClaims: true,
    trustedReference: "vitest",
  };
  const policyCommitment = sha256Hex(canonicalJson(policy));
  const runCommitment = sha256Hex(
    canonicalJson({
      command,
      repoRoot: PROJECT_ROOT,
      exportedAtMs,
      policyCommitment,
    })
  );
  const priv = process.env.OMEGA_PROOF_SIGNING_PRIVATE_KEY_PEM;
  const pub = process.env.OMEGA_PROOF_SIGNING_PUBLIC_KEY_PEM;
  let signing: ProofMeta["signing"] | undefined;
  if (priv && pub) {
    signing = {
      enabled: true,
      algo: "Ed25519",
      publicKeyPem: pub,
      signedMessage: "runCommitment",
    };
  }
  return {
    demo: "research-lab",
    schemaVersion: "RLT-1.0",
    hashAlgo: "SHA-256",
    exportedAtMs,
    repoRoot: PROJECT_ROOT,
    command,
    ci: !!process.env.CI,
    policy,
    policyCommitment,
    runCommitment,
    signing,
  };
}

function pushRecord(
  meta: ProofMeta,
  trace: ProofRecord[],
  type: ProofRecordType,
  data: unknown
): void {
  const index = trace.length;
  const tsMs = Date.now();
  const prevHash = index === 0 ? "GENESIS" : trace[index - 1].hash;
  const recBase: Omit<ProofRecord, "hash"> = { index, tsMs, type, data, prevHash };
  const payload = buildRecordPayload(meta, recBase);
  const hash = sha256Hex(canonicalJson(payload));
  trace.push({ ...recBase, hash });
}

function verifyBundle(meta: ProofMeta, trace: ProofRecord[], hadJson: boolean): ProofVerification {
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
    };
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

export async function POST() {
  const command = "npx vitest run src/research-lab --reporter=json";
  const meta = buildMeta(command);
  const trace: ProofRecord[] = [];

  pushRecord(meta, trace, "RUN_START", {
    command: meta.command,
    cwd: PROJECT_ROOT,
    nodeVersion: process.version,
  });
  const TIMEOUT_MS = 90_000;

  return new Promise<NextResponse>((resolve) => {
    const vitest = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["vitest", "run", "src/research-lab", "--reporter=json"],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env, FORCE_COLOR: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";
    let finished = false;
    let hadJson = false;

    vitest.stdout.setEncoding("utf8");
    vitest.stderr.setEncoding("utf8");
    vitest.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    vitest.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    function extractLastJsonObject(text: string): any | null {
      const s = text.trim();
      for (let end = s.length - 1; end >= 0; end--) {
        if (s[end] === "}") {
          let depth = 0;
          for (let start = end; start >= 0; start--) {
            const ch = s[start];
            if (ch === "}") depth++;
            else if (ch === "{") {
              depth--;
              if (depth === 0) {
                const candidate = s.slice(start, end + 1);
                try {
                  return JSON.parse(candidate);
                } catch {
                  // continue searching
                }
              }
            }
          }
        }
      }
      return null;
    }

    const timeoutId = setTimeout(() => {
      if (finished) return;
      finished = true;
      vitest.kill();
      pushRecord(meta, trace, "VITEST_SUMMARY", {
        error: "timeout",
        timeoutMs: TIMEOUT_MS,
        stderrTail: stderr.slice(-2000),
      });
      pushRecord(meta, trace, "RUN_END", {
        exitCode: -1,
        signal: "timeout",
        hadJson: false,
      });
      const verification = verifyBundle(meta, trace, false);
      const proof: ProofBundle = {
        meta,
        trace,
        verification,
      };
      resolve(
        NextResponse.json({
          success: false,
          exitCode: -1,
          totalTests: 0,
          passed: 0,
          failed: 0,
          filesPassed: 0,
          filesFailed: 0,
          output: stdout.slice(-8000),
          errorOutput: stderr.slice(-2000),
          proof,
        })
      );
    }, TIMEOUT_MS);

    vitest.on("close", (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);

      const vitestJson = extractLastJsonObject(stdout);

      let success = false;
      let totalTests = 0;
      let passed = 0;
      let failed = 0;
      let filesPassed = 0;
      let filesFailed = 0;

      if (vitestJson && typeof vitestJson === "object") {
        hadJson = true;
        if (typeof vitestJson.numTotalTests === "number") {
          totalTests = vitestJson.numTotalTests;
          passed = vitestJson.numPassedTests ?? 0;
          failed = vitestJson.numFailedTests ?? 0;
        }
        success = !!(vitestJson.success && (code ?? 1) === 0);

        let testResults: any[] = [];
        if (Array.isArray(vitestJson.testResults)) {
          testResults = vitestJson.testResults;
        } else if (Array.isArray(vitestJson.files)) {
          testResults = vitestJson.files;
        }

        filesPassed = testResults.filter((f: any) => f.status === "passed").length;
        filesFailed = testResults.filter((f: any) => f.status === "failed").length;

        const summaryData: Record<string, unknown> = {
          totals: {
            totalTests,
            passedTests: passed,
            failedTests: failed,
          },
          stderrTail: stderr.slice(-2000),
        };
        if (typeof vitestJson.numTotalTestSuites === "number") {
          summaryData.numTotalTestSuites = vitestJson.numTotalTestSuites;
          summaryData.numPassedTestSuites = vitestJson.numPassedTestSuites;
          summaryData.numFailedTestSuites = vitestJson.numFailedTestSuites;
        } else {
          summaryData.rawKeys = Object.keys(vitestJson);
        }

        pushRecord(meta, trace, "VITEST_SUMMARY", summaryData);

        if (testResults.length > 0) {
          for (const file of testResults) {
            const fileName: string = file.name ?? "";
            const assertions: any[] = Array.isArray(file.assertionResults)
              ? file.assertionResults
              : [];
            const numTestsFile = assertions.length;
            const numFailedFile = assertions.filter((a) => a.status === "failed").length;
            const numPassedFile = assertions.filter((a) => a.status === "passed").length;
            const status: "passed" | "failed" =
              numFailedFile > 0 || file.status === "failed" ? "failed" : "passed";

            pushRecord(meta, trace, "FILE_RESULT", {
              filePath: fileName,
              status,
              numTests: numTestsFile,
              numFailed: numFailedFile,
              numPassed: numPassedFile,
            });
          }
        }
      } else {
        success = false;
        hadJson = false;
        pushRecord(meta, trace, "VITEST_SUMMARY", {
          error: "Vitest JSON parse failed",
          stdoutTail: stdout.slice(-2000),
          stderrTail: stderr.slice(-2000),
        });
      }

      pushRecord(meta, trace, "RUN_END", {
        exitCode: code ?? -1,
        signal: signal ?? null,
        hadJson,
      });

      // Attach optional signature (if configured) over runCommitment
      const priv = process.env.OMEGA_PROOF_SIGNING_PRIVATE_KEY_PEM;
      if (meta.signing?.enabled && priv) {
        try {
          const sig = crypto.sign(
            null,
            Buffer.from(meta.runCommitment, "utf8"),
            priv
          );
          meta.signing.signatureB64 = sig.toString("base64");
        } catch {
          pushRecord(meta, trace, "VITEST_SUMMARY", {
            error: "signature_signing_failed",
          });
        }
      }

      const verification = verifyBundle(meta, trace, hadJson);

      const proof: ProofBundle = {
        meta,
        trace,
        verification,
      };

      resolve(
        NextResponse.json({
          success,
          exitCode: code ?? -1,
          totalTests,
          passed,
          failed,
          filesPassed,
          filesFailed,
          output: stdout.slice(-8000),
          errorOutput: stderr.slice(-2000),
          proof,
        })
      );
    });

    vitest.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      hadJson = false;
      pushRecord(meta, trace, "VITEST_SUMMARY", {
        error: err.message,
        stderrTail: stderr.slice(-2000),
      });
      pushRecord(meta, trace, "RUN_END", {
        exitCode: -1,
        signal: "error",
        hadJson: false,
      });
      const priv = process.env.OMEGA_PROOF_SIGNING_PRIVATE_KEY_PEM;
      if (meta.signing?.enabled && priv) {
        try {
          const sig = crypto.sign(
            null,
            Buffer.from(meta.runCommitment, "utf8"),
            priv
          );
          meta.signing.signatureB64 = sig.toString("base64");
        } catch {
          pushRecord(meta, trace, "VITEST_SUMMARY", {
            error: "signature_signing_failed",
          });
        }
      }
      const verification = verifyBundle(meta, trace, false);
      const proof: ProofBundle = {
        meta,
        trace,
        verification,
      };
      resolve(
        NextResponse.json(
          {
            success: false,
            error: err.message,
            output: stdout,
            errorOutput: stderr,
            proof,
          },
          { status: 500 }
        )
      );
    });
  });
}
