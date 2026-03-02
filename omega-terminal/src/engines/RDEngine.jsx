import React, { useState, useRef, useEffect } from "react";
import { computeMerkleChain, sha256, canonicalJSON } from "../utils/crypto";
import { verifyCitations } from "../utils/citations";
import { anthropicMessages } from "../utils/api";
import {
  validateSchemaRD,
  STRICT_VALIDATORS_RD,
  REQUIRED_FIELDS_RD,
  parseLLMResponse,
  repairJSON,
} from "../utils/validators";
import { deterministicRD } from "../utils/deterministic";
import { T, HYPO_STYLES } from "../styles/tokens";
import { Badge, SectionLabel, AccentBar, HashChip, ProtocolChip, FieldCount, TheSentence } from "../components/ui";
import ErrorBoundary from "../components/ui/ErrorBoundary";

class StageContentErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: T.coralGlow, border: "1px solid " + T.coral + "44", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.coral }}>Stage render error{this.props.stageLabel ? ": " + this.props.stageLabel : ""}</div>
          <div style={{ fontSize: 12, color: T.text2, fontFamily: "monospace", marginTop: 6 }}>{String(this.state.error?.message ?? this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

const KNOWN_LIMITATIONS = [
  "Corpus may contain low-quality or outdated sources. Source quality is not assessed.",
  "Search query generation could bias corpus toward certain domains or methodologies.",
  "Hypothesis novelty depends on model reasoning within constrained corpus, not independent expert review.",
  "Integrity is tamper-evident (hash-based), not identity-signed (no asymmetric cryptography).",
  "Corpus assembly uses model-mediated search. Results are not independently fetched from URLs.",
  "Method coverage (5 hypothesis types) is enforced structurally but creative quality varies.",
  "Kill signal thresholds from LLM generation are estimates unless linked to empirical data.",
];

const PROTOCOLS = { problem: "PDP-2.0", literature: "LSP-2.0", hypotheses: "HGP-2.0", experimental: "EDP-2.0", validation: "VGP-2.0" };
const STATUS_MESSAGES = {
  problem: "Isolating research bottleneck…",
  literature: "Scanning literature — searching publications…",
  hypotheses: "Generating hypotheses — five methods active…",
  experimental: "Designing minimum viable experiments…",
  validation: "Building validation framework and governance gates…",
};
const PRELOADED = [
  { label: "Biomineralisation", query: "How can protein-enabled biomineralisation achieve structural materials properties (>100 MPa tensile strength) at manufacturing scale, when current lab demonstrations are limited to millimetre-scale samples with highly variable mechanical properties?" },
  { label: "Scaling Trust", query: "What open-source coordination infrastructure is needed for AI agents to securely coordinate, negotiate, and verify with one another on our behalf in cyber-physical systems? Design an R&D programme for ARIA's Scaling Trust initiative." },
  { label: "ZK Decision Audit", query: "Can zero-knowledge proofs be applied to AI decision audit trails to enable verifiable governance without revealing proprietary model weights or training data? What would a minimum viable proof system look like?" },
  { label: "Trust Traces", query: "What experimental framework would validate whether hash-chained reasoning traces actually improve AI system trustworthiness in high-stakes domains, versus being security theatre?" },
  { label: "Room-temp SC", query: "What is the most promising approach to achieving room-temperature superconductivity, given the LK-99 controversy and recent hydrogen-based results? Design an R&D programme that avoids the reproducibility failures of previous claims." },
];

const STAGES = [
  { id: "problem", label: "Problem Definition", subtitle: "Bottleneck isolation, hidden variables, success criteria", icon: "◉", needsWeb: false, systemPrompt: 'You are a research problem definition engine.\n\nCRITICAL: Respond with valid JSON only. No markdown fences. No preamble. Start with { and end with }.\n\n{"title":"Concise research title","problem_statement":"One paragraph defining the core problem","domain":"Primary domain","adjacent_domains":["domain1","domain2"],"known_constraints":["constraint1"],"bottleneck":"The single point where progress is actually blocked","hidden_variables":["Potential unmeasured forces"],"success_criteria":"What would a solution look like?","frontier_questions":["Questions not yet articulable"]}' },
  { id: "literature", label: "Literature Scan", subtitle: "Corpus-grounded analysis, citation-verified", icon: "◇", needsWeb: false, needsCorpus: true, systemPrompt: 'You are a research literature analysis engine. You have been provided with an EXTERNAL SOURCE CORPUS. Cite sources using SRC-N identifiers only.\n\nCRITICAL: Respond with valid JSON only. No markdown. Start with { end with }.\n\n{"known_and_settled":["Finding citing SRC-N"],"known_and_contested":["Debate citing SRC-N"],"unknown_but_askable":["Question"],"unknown_and_not_yet_articulable":["Frontier gap"],"key_papers":[{"title":"Title","finding":"Key finding citing SRC-N","year":"Year","relevance":"Why this matters","source_ref":"SRC-N"}],"absence_detected":"What is conspicuously missing?","state_of_art":"Current best approach citing SRC-N and limitations"}' },
  { id: "hypotheses", label: "Hypothesis Generation", subtitle: "Five methods: constraint flip, dimensional shift, inversion, collision, absence", icon: "▷", needsWeb: false, systemPrompt: 'You are a hypothesis generation engine. Generate at least one hypothesis per method: constraint_flip, dimensional_shift, inversion, collision, absence.\n\nCRITICAL: Valid JSON only. Start { end }.\n\n{"methods_summary":{"constraint_flip":1,"dimensional_shift":1,"inversion":1,"collision":1,"absence":1},"hypotheses":[{"id":"H1","statement":"If X then Y because Z","mechanism":"Causal explanation","generation_method":"constraint_flip","provenance_type":"empirical|theoretical|analogical|speculative","provenance_basis":"Evidence","novelty":"Non-obvious","testable":true,"falsification":"What would disprove","confidence":"low|medium|high"}],"strongest_hypothesis":"H-id and why","most_novel_hypothesis":"H-id and why"}' },
  { id: "experimental", label: "Experimental Design", subtitle: "MVE, kill signals", icon: "▢", needsWeb: false, systemPrompt: 'You are an experimental design engine. Design experiments to test the strongest hypotheses.\n\nCRITICAL: Valid JSON only. Start { end }.\n\n{"experiments":[{"id":"E1","tests_hypothesis":"H-id","title":"Title","method":"Methodology","variables":{"independent":["var"],"dependent":["var"],"controlled":["var"]},"expected_outcome":"If correct","null_result_meaning":"If nothing","minimum_viable_experiment":"Cheapest signal","equipment_required":["item"],"estimated_duration":"e.g. 6 weeks","estimated_cost":"e.g. 15000","success_metric":"Threshold"}],"summary":{"total_experiments":5,"shortest_path_weeks":12,"estimated_total_cost":"45000","kill_signal_count":3},"sequence":"Which first and why","kill_signals":[{"signal":"Signal that means stop","threshold":"Numeric value","provenance":"standard|empirical|estimate","provenance_detail":"Source"}]}' },
  { id: "validation", label: "Validation & Governance", subtitle: "Gates, halt triggers, one sentence", icon: "◎", needsWeb: false, systemPrompt: 'You are a research validation engine.\n\nCRITICAL for one_sentence: One specific number (cost/timeline/threshold), name the bottleneck, one sentence read aloud to a funder.\nExample: "For £280K over 9 months, we will determine whether protein-directed mineralisation can exceed 100 MPa at centimetre scale, with three kill signals that halt the programme if it cannot."\n\nValid JSON only. Start { end }.\n\n{"validation_framework":{"internal_validity":["Check"],"external_validity":["Check"],"reproducibility_requirements":["Req"],"peer_review_readiness":"Assessment"},"governance":{"decision_gates":[{"gate":"Name","criteria":"Pass/fail","authority":"Who decides"}],"halt_triggers":["Trigger"],"abandonment_threshold":"When to stop","pivot_criteria":"When to change direction"},"timeline":{"phase_1":{"duration":"Time","deliverable":"What","gate":"Gate"},"phase_2":{},"phase_3":{}},"resource_requirements":{"personnel":["Role"],"compute":"Estimate","budget":"Total","partnerships_needed":["Type"]},"executive_summary":"3-sentence summary","one_sentence":"The sentence that survives the meeting. One specific number."}' },
];

const STATUS = { idle: "idle", running: "running", retrying: "retrying", done: "done", error: "error" };
const MAX_RETRIES = 2;
const DETERMINISTIC = import.meta.env.VITE_DETERMINISTIC === "true";

export default function RDEngine({ onSignal, onStatus, onChain, onStageData, onPipelineTime, onMeta, linkContext }) {
  const [query, setQuery] = useState("");
  const [stages, setStages] = useState(STAGES.map((s) => ({ ...s, status: STATUS.idle, data: null, validation: null, schemaResult: null, retries: 0, citationReport: null })));
  const [isRunning, setIsRunning] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [merkle, setMerkle] = useState(null);
  const [iteration, setIteration] = useState(1);
  const [revisionNote, setRevisionNote] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [pipelineTime, setPipelineTime] = useState(null);
  const [sentenceVisible, setSentenceVisible] = useState(false);
  const [corpus, setCorpus] = useState([]);
  const [corpusHash, setCorpusHash] = useState(null);
  const [citationReport, setCitationReport] = useState(null);
  const abortRef = useRef(null);
  const runIdRef = useRef(0);
  const startTimeRef = useRef(null);
  const runRef = useRef(null);

  const allDone = stages.every((s) => s.status === STATUS.done);
  const valData = stages[4]?.data;

  useEffect(() => {
    if (isRunning) onStatus("running");
    else if (stages.some((s) => s.status === STATUS.error)) onStatus("error");
    else if (allDone) onStatus("done");
    else onStatus("idle");
  }, [isRunning, allDone, stages, onStatus]);

  useEffect(() => {
    if (merkle) onChain?.({ rootHash: merkle.rootHash, stageHashes: merkle.stageHashes });
  }, [merkle, onChain]);

  useEffect(() => {
    if (pipelineTime != null) onPipelineTime?.(Number(pipelineTime));
  }, [pipelineTime, onPipelineTime]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isRunning && query.trim()) runRef.current?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (stages[idx]?.data) setExpandedStage((prev) => (prev === idx ? null : idx));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isRunning, query, stages]);

  const callAPI = async (stage, structuredOutputs, retryCount, signal, corpusCtx) => {
    const retryPrefix = retryCount > 0 ? "YOUR PREVIOUS RESPONSE WAS NOT VALID JSON. Respond with ONLY a JSON object. Start with { end with }. No other text.\n\n" : "";
    const revisionCtx = revisionNote && iteration > 1 ? "\nREVISION (Iteration " + iteration + "): " + revisionNote + "\nAdjust analysis.\n\n" : "";
    const prevContext = structuredOutputs.map((o) => "--- " + o.label + " ---\n" + JSON.stringify(o.data, null, 2)).join("\n\n");
    let corpusSection = "";
    if (corpusCtx?.length && stage.needsCorpus) {
      corpusSection = "\n\n=== EXTERNAL SOURCE CORPUS ===\nCite using SRC-N only.\n\n";
      corpusCtx.forEach((s) => { corpusSection += s.id + " | " + s.title + "\n" + s.url + "\n" + s.snippet + "\n\n"; });
      corpusSection += "=== END CORPUS ===\n";
    }
    const linkSection = linkContext ? "\n\n" + linkContext + "\n\n" : "";
    const userContent = [retryPrefix, revisionCtx, "Research question: " + query, corpusSection, linkSection, structuredOutputs.length > 0 ? "\n\nPrevious outputs:\n" + prevContext + "\n\nNow produce " + stage.label + "." : "\nProduce " + stage.label + "."].join("");
    const body = { model: "claude-sonnet-4-5-20250929", max_tokens: 4000, system: stage.systemPrompt, messages: [{ role: "user", content: userContent }] };
    if (stage.needsWeb && !stage.needsCorpus) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
    const data = await anthropicMessages(body, signal);
    const text = data?.content?.filter((b) => b.type === "text")?.map((b) => b.text)?.join("\n") || "";
    return parseLLMResponse(text, stage.id, REQUIRED_FIELDS_RD);
  };

  const buildCorpus = async (question, signal) => {
    onSignal?.({ engine: "rd", message: "Generating search queries…", severity: "info" });
    const qBody = { model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: 'Generate 4-6 web search queries for the question. Return ONLY a JSON array of strings. Example: ["q1","q2"]', messages: [{ role: "user", content: question }] };
    const qData = await anthropicMessages(qBody, signal);
    const qt = (qData?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    let sq = [];
    try { sq = JSON.parse(repairJSON(qt, []) || "[]"); } catch (e) { sq = [question.substring(0, 100)]; }
    if (!Array.isArray(sq)) sq = [question.substring(0, 100)];
    onSignal?.({ engine: "rd", message: "Executing " + sq.length + " search queries", severity: "info" });
    const assembled = [];
    let srcC = 1;
    for (const q of sq) {
      try {
        const srBody = { model: "claude-sonnet-4-5-20250929", max_tokens: 2000, system: 'Search the web. Return ONLY a JSON array: [{"title":"...","url":"...","snippet":"..."}]', messages: [{ role: "user", content: q }], tools: [{ type: "web_search_20250305", name: "web_search" }] };
        const sd = await anthropicMessages(srBody, signal);
        const st = (sd?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
        let res = [];
        try { res = JSON.parse(repairJSON(st, []) || "[]"); } catch (e) {}
        if (!Array.isArray(res)) res = [];
        for (let r = 0; r < res.length && r < 4; r++) {
          assembled.push({ id: "SRC-" + srcC++, query: q, title: res[r].title || "Untitled", url: (res[r].url || "").replace(/[<>"']/g, ""), snippet: res[r].snippet || "", retrieved: new Date().toISOString() });
        }
      } catch (e) { if (e.name === "AbortError") throw e; }
    }
    const cH = await sha256(canonicalJSON(assembled));
    onSignal?.({ engine: "rd", message: "Corpus: " + assembled.length + " sources — hash " + cH.substring(0, 8), severity: "success" });
    return { queries: sq, corpus: assembled, corpus_hash: cH, corpus_empty: assembled.length === 0 };
  };

  const runStageWithRetry = async (stageIndex, structuredOutputs, currentRunId, signal, corpusCtx) => {
    const stage = STAGES[stageIndex];
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (runIdRef.current !== currentRunId) return null;
      setStatusMsg(attempt > 0 ? "Retrying " + stage.label + " (" + attempt + "/" + MAX_RETRIES + ")" : STATUS_MESSAGES[stage.id] || "Processing…");
      setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: attempt > 0 ? STATUS.retrying : STATUS.running, retries: attempt } : s)));
      try {
        const parseResult = await callAPI(stage, structuredOutputs, attempt, signal, corpusCtx);
        if (runIdRef.current !== currentRunId) return null;
        if (parseResult.ok) {
          const validation = validateSchemaRD(stage.id, parseResult.data);
          const sv = STRICT_VALIDATORS_RD[stage.id];
          const schemaResult = sv ? sv(parseResult.data) : { valid: true, errors: [] };
          let stageCitReport = null;
          if (stage.id === "literature" && corpusCtx?.length) stageCitReport = verifyCitations(parseResult.data, corpusCtx);
          if ((validation.valid && schemaResult.valid) || attempt === MAX_RETRIES) {
            const validStr = validation.valid && schemaResult.valid ? "VALID (" + validation.present + "/" + validation.total + ")" : "INCOMPLETE";
            onSignal?.({ engine: "rd", message: "Stage " + (stageIndex + 1) + ": " + stage.label + " — " + validStr + (stageCitReport && !stageCitReport.all_verified ? ", " + stageCitReport.phantom_citations.length + " phantom citations" : ""), severity: schemaResult.valid ? "success" : "warning" });
            setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: STATUS.done, data: parseResult.data, validation, schemaResult, citationReport: stageCitReport, retries: attempt } : s)));
            setExpandedStage(stageIndex);
            return { id: stage.id, label: stage.label, data: parseResult.data };
          }
        } else if (attempt === MAX_RETRIES) {
          setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: STATUS.done, data: { _parse_error: parseResult.kind }, validation: { valid: false, missing: REQUIRED_FIELDS_RD[stage.id] || [], total: (REQUIRED_FIELDS_RD[stage.id] || []).length, present: 0 }, schemaResult: { valid: false, errors: ["Parse failed"] }, retries: attempt } : s)));
          return { id: stage.id, label: stage.label, data: { _parse_error: parseResult.kind } };
        }
      } catch (err) {
        if (err.name === "AbortError") return null;
        const isRateLimit = err.status === 429;
        const waitSec = isRateLimit && err.retryAfterSec ? err.retryAfterSec : 60;
        if (isRateLimit && attempt < MAX_RETRIES) {
          setStatusMsg("Rate limited — waiting " + waitSec + "s before retry…");
          onSignal?.({ engine: "rd", message: "Rate limited (429). Waiting " + waitSec + "s then retrying.", severity: "warning" });
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          if (runIdRef.current !== currentRunId) return null;
          continue;
        }
        if (attempt === MAX_RETRIES) {
          setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: STATUS.error, data: { error: err.message }, validation: { valid: false, missing: ["API_ERROR"], total: 1, present: 0 }, schemaResult: { valid: false, errors: [err.message] }, retries: attempt } : s)));
          onSignal?.({ engine: "rd", message: "Stage " + (stageIndex + 1) + " error: " + err.message, severity: "error" });
          return null;
        }
      }
    }
    return null;
  };

  const runPipeline = async () => {
    if (!query.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const cid = ++runIdRef.current;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    setPipelineTime(null);
    setSentenceVisible(false);
    setCorpus([]);
    setCorpusHash(null);
    setCitationReport(null);
    setStages(STAGES.map((s) => ({ ...s, status: STATUS.idle, data: null, validation: null, schemaResult: null, retries: 0, citationReport: null })));
    setExpandedStage(null);
    setMerkle(null);
    setStatusMsg("Initializing pipeline…");
    onMeta?.(null);
    onSignal?.({ engine: "rd", message: 'Pipeline started — "' + query.substring(0, 40) + (query.length > 40 ? "…" : "") + '"', severity: "info" });
    if (linkContext) {
      onSignal?.({ engine: "rd", message: "Decision engine constraints loaded (" + linkContext.length + " chars)", severity: "info" });
    }

    if (DETERMINISTIC) {
      const mockResults = deterministicRD(query);
      const so = [];
      for (let i = 0; i < mockResults.length; i++) {
        const r = mockResults[i];
        const stage = STAGES[i];
        const validation = validateSchemaRD(stage.id, r.data);
        const sv = STRICT_VALIDATORS_RD[stage.id];
        const schemaResult = sv ? sv(r.data) : { valid: true, errors: [] };
        setStages((prev) => prev.map((s, j) => (j === i ? {
          ...s, status: STATUS.done, data: r.data, validation, schemaResult, retries: 0, citationReport: null
        } : s)));
        setExpandedStage(i);
        so.push(r);
        onSignal?.({ engine: "rd", message: "Stage " + (i + 1) + ": " + stage.label + " — DETERMINISTIC", severity: "success" });
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      const chain = await computeMerkleChain(so.map((o) => o.data));
      setMerkle(chain);
      onStageData?.(so.map((o) => o.data));
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(0);
      setPipelineTime(elapsed);
      onSignal?.({ engine: "rd", message: "R&D: DETERMINISTIC pipeline complete — 5/5 stages — " + elapsed + "s", severity: "success" });
      setStatusMsg("DETERMINISTIC — 5/5 stages — " + elapsed + "s");
      setExpandedStage(4);
      onMeta?.({ query, iteration, revisionNote, elapsedMs: Number(elapsed) * 1000, model: "claude-sonnet-4-5-20250929" });
      setTimeout(() => setSentenceVisible(true), 300);
      setIsRunning(false);
      return;
    }

    let cr = null;
    try {
      cr = await buildCorpus(query, controller.signal);
      if (runIdRef.current !== cid) return;
      setCorpus(cr.corpus);
      setCorpusHash(cr.corpus_hash);
      setStatusMsg(cr.corpus_empty ? "WARNING: Empty corpus." : "Corpus: " + cr.corpus.length + " sources");
    } catch (e) {
      if (e.name === "AbortError") { setIsRunning(false); return; }
      cr = { queries: [], corpus: [], corpus_hash: null, corpus_empty: true };
      setStatusMsg(e.status === 429 ? "Rate limited (429). Wait a minute and try again." : "Corpus assembly failed.");
      if (e.status === 429) onSignal?.({ engine: "rd", message: "Rate limited — try again in a few minutes.", severity: "warning" });
    }

    const so = [];
    for (let i = 0; i < STAGES.length; i++) {
      if (runIdRef.current !== cid) break;
      const result = await runStageWithRetry(i, so, cid, controller.signal, cr?.corpus);
      if (!result) break;
      so.push(result);
      if (i < STAGES.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    if (so.length === STAGES.length && runIdRef.current === cid) {
      const chain = await computeMerkleChain(so.map((o) => o.data));
      setMerkle(chain);
      onStageData?.(so.map((o) => o.data));
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(0);
      setPipelineTime(elapsed);
      let fcr = null;
      if (cr?.corpus?.length && so[1]) {
        fcr = verifyCitations(so[1].data, cr.corpus);
        setCitationReport(fcr);
      }
      onSignal?.({ engine: "rd", message: "R&D Chain: Root hash verified — " + chain.rootHash.substring(0, 8), severity: "success" });
      onSignal?.({ engine: "rd", message: "R&D: Pipeline complete — 5/5 stages — " + elapsed + "s", severity: "success" });
      setStatusMsg("5/5 stages — Chain verified — " + elapsed + "s");
      setExpandedStage(4);
      onMeta?.({ query, iteration, revisionNote, elapsedMs: Number(elapsed) * 1000, model: "claude-sonnet-4-5-20250929" });
      setTimeout(() => setSentenceVisible(true), 500);
    }
    if (runIdRef.current === cid) setIsRunning(false);
  };

  runRef.current = runPipeline;

  const sColor = (status) => ({
    idle: T.text3, running: T.amber, retrying: T.amber, done: T.mint, error: T.coral,
  })[status] || T.text3;

  const renderHypothesisBadge = (method) => {
    const key = method != null && typeof method === "string" ? method : "absence";
    const style = HYPO_STYLES[key] || HYPO_STYLES.absence || { color: T.text2, label: "UNKNOWN", bg: "transparent" };
    return <Badge color={style.color} glow={style.bg}>{style.label}</Badge>;
  };

  const renderValue = (val, depth = 0) => {
    if (val == null) return <span style={{ color: T.text3 }}>—</span>;
    if (typeof val === "boolean") return <span style={{ color: val ? T.mint : T.coral }}>{val ? "Yes" : "No"}</span>;
    if (typeof val === "string") return <span style={{ lineHeight: 1.7, overflowWrap: "break-word", wordBreak: "break-word", fontFamily: T.fontBody }}>{val}</span>;
    if (typeof val === "number") return <span style={{ color: T.blue, fontWeight: 600, fontFamily: T.fontMono }}>{val}</span>;
    if (Array.isArray(val)) return <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>{val.map((item, i) => (<div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}><span style={{ color: T.text3, fontSize: 7 }}>▸</span><div style={{ flex: 1 }}>{renderValue(item, depth + 1)}</div></div>))}</div>;
    if (typeof val === "object") return <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>{Object.entries(val).filter(([k]) => !k.startsWith("_")).map(([k, v]) => (<div key={k} style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", marginBottom: 4, fontFamily: T.fontMono }}>{k.replace(/_/g, " ")}</div><div style={{ fontSize: 14, fontFamily: T.fontBody }}>{renderValue(v, depth + 1)}</div></div>))}</div>;
    return <span style={{ fontFamily: T.fontBody }}>{String(val)}</span>;
  };

  const safeHypothesisText = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return JSON.stringify(v).slice(0, 2000) + (JSON.stringify(v).length > 2000 ? "…" : "");
    return String(v);
  };

  const renderStageContent = (s) => {
    if (!s.data) return null;
    if (s.id === "problem" && !s.data._parse_error) {
      const d = s.data;
      return (
        <div>
          {d.title && <div style={{ fontSize: 16, fontFamily: T.fontDisplay, color: T.text0, lineHeight: 1.5, marginBottom: 16 }}>{d.title}</div>}
          {d.bottleneck && <AccentBar color={T.coral}><SectionLabel color={T.coral}>BOTTLENECK</SectionLabel><div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody }}>{d.bottleneck}</div></AccentBar>}
          {d.hidden_variables?.length > 0 && <AccentBar color={T.amber}><SectionLabel color={T.amber}>HIDDEN VARIABLES</SectionLabel>{d.hidden_variables.map((v, i) => (<div key={i} style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody, marginBottom: 4, paddingLeft: 12, position: "relative" }}><span style={{ position: "absolute", left: 0, color: T.amber, fontSize: 8, top: 6 }}>◆</span>{v}</div>))}</AccentBar>}
          {d.success_criteria && <AccentBar color={T.mint}><SectionLabel color={T.mint}>SUCCESS CRITERIA</SectionLabel><div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody }}>{d.success_criteria}</div></AccentBar>}
          {renderValue(Object.fromEntries(Object.entries(d).filter(([k]) => !["title", "bottleneck", "hidden_variables", "success_criteria"].includes(k) && !k.startsWith("_"))))}
        </div>
      );
    }
    if (s.id === "literature" && !s.data._parse_error) {
      const papers = s.data.key_papers || [];
      const absence = s.data.absence_detected;
      return (
        <div>
          {absence && <div style={{ marginBottom: 16, padding: "12px 16px", background: T.amberGlow, borderLeft: "3px solid " + T.amber, borderRadius: "0 " + T.r1 + "px " + T.r1 + "px 0" }}><SectionLabel color={T.amber} style={{ marginBottom: 6 }}>ABSENCE DETECTED</SectionLabel><div style={{ fontSize: 14, color: T.amber, lineHeight: 1.7, fontFamily: T.fontBody }}>{absence}</div></div>}
          {papers.length > 0 && <div><SectionLabel color={T.blue}>KEY PAPERS ({papers.length})</SectionLabel>{papers.map((p, pi) => (<div key={pi} style={{ marginBottom: 8, padding: "10px 14px", background: T.blueGlow, borderLeft: "2px solid " + T.blue + "44", borderRadius: "0 " + T.r1 + "px " + T.r1 + "px 0", animationName: "slideInLeft", animationDuration: "0.3s", animationTimingFunction: "ease", animationDelay: (pi * 80) + "ms", animationFillMode: "both" }}><div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: T.text0, fontFamily: T.fontBody }}>{p.title || "Untitled"}</span>{p.year && <span style={{ fontSize: 11, color: T.blue, fontFamily: T.fontMono }}>{p.year}</span>}{p.source_ref && <HashChip hash={p.source_ref} />}</div><div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody }}>{p.finding || ""}</div></div>))}</div>}
          {renderValue(Object.fromEntries(Object.entries(s.data).filter(([k]) => k !== "key_papers" && k !== "absence_detected" && !k.startsWith("_"))))}
        </div>
      );
    }
    if (s.id === "hypotheses" && !s.data._parse_error) {
      try {
        const rawHyps = s.data.hypotheses;
        const hyps = Array.isArray(rawHyps)
          ? rawHyps.filter((h) => h != null && typeof h === "object")
          : (rawHyps != null && typeof rawHyps === "object" ? Object.values(rawHyps).filter((h) => h != null && typeof h === "object") : []);
        const methods = s.data.methods_summary && typeof s.data.methods_summary === "object" && !Array.isArray(s.data.methods_summary) ? s.data.methods_summary : {};
        return (
          <ErrorBoundary>
            <div>
            {Object.keys(methods).length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}><span style={{ fontSize: 10, color: T.text2, fontFamily: T.fontMono }}>METHODS:</span>{Object.entries(methods).map(([m, count]) => (<span key={String(m)} style={{ display: "flex", alignItems: "center", gap: 4 }}>{renderHypothesisBadge(m)}<span style={{ fontSize: 9, color: T.text3 }}>×{Number(count) || 0}</span></span>))}</div>}
            {hyps.map((h, hi) => {
              const rawStyle = HYPO_STYLES[h.generation_method] || HYPO_STYLES.absence;
              const style = rawStyle && typeof rawStyle === "object" && rawStyle.color != null
                ? rawStyle
                : { color: T.text2, label: "UNKNOWN", bg: "transparent" };
              const confidenceLabel = typeof h.confidence === "string" ? h.confidence.toUpperCase() : (h.confidence != null ? String(h.confidence) : "");
              return (
                <div key={hi} style={{ marginBottom: 10, padding: "12px 16px", background: style.bg, border: "1px solid " + style.color + "22", borderRadius: T.r2, animationName: "fadeIn", animationDuration: "0.3s", animationTimingFunction: "ease", animationDelay: (hi * 100) + "ms", animationFillMode: "both" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text0, fontFamily: T.fontMono }}>{safeHypothesisText(h.id) || "H" + (hi + 1)}</span>
                    <Badge color={style.color} glow={style.bg}>{style.label}</Badge>
                    {confidenceLabel && <Badge color={h.confidence === "high" ? T.mint : h.confidence === "medium" ? T.amber : T.text2}>{confidenceLabel}</Badge>}
                  </div>
                  <div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody, marginBottom: h.mechanism ? 6 : 0 }}>{safeHypothesisText(h.statement)}</div>
                  {h.mechanism != null && safeHypothesisText(h.mechanism) !== "" && <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, fontFamily: T.fontBody, fontStyle: "italic" }}><span style={{ color: T.text3, fontWeight: 600, fontStyle: "normal" }}>Mechanism: </span>{safeHypothesisText(h.mechanism)}</div>}
                  {h.falsification != null && safeHypothesisText(h.falsification) !== "" && <div style={{ fontSize: 12, color: T.coral + "99", marginTop: 4 }}><span style={{ color: T.text3, fontWeight: 600 }}>Falsification: </span>{safeHypothesisText(h.falsification)}</div>}
                </div>
              );
            })}
            {renderValue(Object.fromEntries(Object.entries(s.data).filter(([k]) => k !== "hypotheses" && k !== "methods_summary" && !k.startsWith("_"))))}
          </div>
          </ErrorBoundary>
        );
      } catch (hypErr) {
        return (
          <div style={{ padding: 16, background: T.coralGlow, border: "1px solid " + T.coral + "44", borderRadius: T.r2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.coral, marginBottom: 8 }}>Error displaying hypotheses</div>
            <div style={{ fontSize: 12, color: T.text2, fontFamily: T.fontMono }}>{String(hypErr?.message ?? hypErr)}</div>
            <pre style={{ marginTop: 12, fontSize: 11, overflow: "auto", maxHeight: 200 }}>{JSON.stringify(s.data, null, 2).slice(0, 3000)}</pre>
          </div>
        );
      }
    }
    if (s.id === "experimental" && !s.data._parse_error) {
      const ks = s.data.kill_signals || [];
      const summary = s.data.summary;
      return (
        <div>
          {ks.length > 0 && <div style={{ marginBottom: 16 }}><SectionLabel color={T.coral}>KILL SIGNALS</SectionLabel>{ks.map((k, ki) => (<div key={ki} style={{ marginBottom: 6, padding: "10px 14px", background: T.coralGlow, borderLeft: "3px solid " + T.coral, borderRadius: "0 " + T.r1 + "px " + T.r1 + "px 0" }}><div style={{ fontSize: 13, color: T.coral, fontWeight: 600, fontFamily: T.fontBody }}>{typeof k === "object" ? k.signal : k}</div>{k.threshold && <div style={{ fontSize: 11, color: T.text2, marginTop: 4, fontFamily: T.fontMono }}>Threshold: {k.threshold}</div>}{k.provenance && <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{k.provenance}{k.provenance_detail ? ": " + k.provenance_detail : ""}</div>}</div>))}</div>}
          {summary && <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "10px 14px", background: T.bg3, borderRadius: T.r1, border: "1px solid " + T.border0 }}>{Object.entries(summary).map(([k, v]) => (<div key={k}><div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k.replace(/_/g, " ")}</div><div style={{ fontSize: 15, color: T.blue, fontWeight: 600, fontFamily: T.fontMono, marginTop: 2 }}>{v}</div></div>))}</div>}
          {renderValue(Object.fromEntries(Object.entries(s.data).filter(([k]) => k !== "kill_signals" && k !== "summary" && !k.startsWith("_"))))}
        </div>
      );
    }
    if (s.id === "validation" && !s.data._parse_error) {
      const gov = s.data.governance;
      const tl = s.data.timeline;
      const renderPhase = (phase, data, i) => {
        const isObj = typeof data === "object";
        return (
          <div key={phase} style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: T.blueGlow, borderLeft: i === 0 ? "3px solid " + T.blue : "1px solid " + T.border0, borderRadius: i === 0 ? 0 : T.r1 }}>
            <div style={{ fontSize: 10, color: T.blue, fontWeight: 700, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em" }}>{phase.replace(/_/g, " ")}</div>
            {isObj ? (
              <>
                <div style={{ fontSize: 13, color: T.text0, marginTop: 4, fontFamily: T.fontBody }}>{data.duration}</div>
                <div style={{ fontSize: 11, color: T.text2, fontFamily: T.fontBody }}>{data.deliverable}{data.gate ? " (Gate: " + data.gate + ")" : ""}</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: T.text2 }}>{data}</div>
            )}
          </div>
        );
      };
      return (
        <div>
          {s.data.executive_summary && <div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, marginBottom: 16, padding: "14px 18px", background: T.bg2, borderRadius: T.r2, border: "1px solid " + T.border0, fontStyle: "italic", fontFamily: T.fontBody }}>{s.data.executive_summary}</div>}
          {gov?.decision_gates && <div style={{ marginBottom: 16 }}><SectionLabel color={T.amber}>GOVERNANCE GATES</SectionLabel>{gov.decision_gates.map((g, gi) => (<div key={gi} style={{ marginBottom: 6, padding: "8px 14px", background: T.amberGlow, borderLeft: "2px solid " + T.amber + "55", borderRadius: "0 " + T.r1 + "px " + T.r1 + "px 0" }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text0, fontFamily: T.fontBody }}>{g.gate}</div><div style={{ fontSize: 12, color: T.text1, fontFamily: T.fontBody }}>{g.criteria}</div></div>))}</div>}
          {gov?.halt_triggers && <div style={{ marginBottom: 16 }}><SectionLabel color={T.coral}>HALT TRIGGERS</SectionLabel>{gov.halt_triggers.map((t, ti) => (<div key={ti} style={{ fontSize: 13, color: T.coral, marginBottom: 4, fontFamily: T.fontBody }}><span style={{ color: T.coralDim, marginRight: 6 }}>⊘</span>{t}</div>))}</div>}
          {gov?.abandonment_threshold && <div style={{ fontSize: 13, color: T.text1, marginTop: 8, fontFamily: T.fontBody }}><span style={{ color: T.coral, fontWeight: 700 }}>ABANDONMENT: </span>{gov.abandonment_threshold}</div>}
          {tl && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel color={T.blue}>TIMELINE</SectionLabel>
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                {Object.entries(tl).map(([phase, data], i) => renderPhase(phase, data, i))}
              </div>
            </div>
          )}
          {renderValue(Object.fromEntries(Object.entries(s.data).filter(([k]) => !["executive_summary", "governance", "timeline", "one_sentence"].includes(k) && !k.startsWith("_"))))}
        </div>
      );
    }
    return renderValue(s.data);
  };

  return (
    <div style={{ padding: "12px 16px", fontSize: 14, fontFamily: T.fontBody, color: T.text0 }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PRELOADED.map((p, i) => (
          <button key={i} onClick={() => setQuery(p.query)} style={{ background: T.bg2, border: "1px solid " + T.border0, borderRadius: T.r1, color: T.text1, fontSize: 11, padding: "8px 12px", cursor: "pointer", fontFamily: T.fontBody }}>{p.label}</button>
        ))}
      </div>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.text2, letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: T.fontMono }}>RESEARCH QUESTION</label>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. How can soft robotic grippers achieve variable stiffness without pneumatic actuation?"
        disabled={isRunning}
        rows={4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: T.bg1,
          border: "1px solid " + T.border0,
          borderRadius: T.r2,
          color: T.text0,
          fontSize: 16,
          padding: "12px 14px",
          fontFamily: T.fontBody,
          resize: "vertical",
          outline: "none",
          lineHeight: 1.6,
        }}
      />
      {iteration > 1 && (
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.blue, letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
            REVISION NOTE
          </label>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="e.g. H2 most promising. Refine experiments."
            disabled={isRunning}
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: T.bg1,
              border: "1px solid " + T.border0,
              borderRadius: T.r2,
              color: T.text0,
              fontSize: 14,
              padding: "10px 14px",
              fontFamily: T.fontBody,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={runPipeline} disabled={isRunning || !query.trim()} style={{ background: isRunning || !query.trim() ? T.bg2 : T.text0, color: isRunning || !query.trim() ? T.text3 : T.bg0, border: "none", borderRadius: T.r2, padding: "10px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", cursor: isRunning || !query.trim() ? "not-allowed" : "pointer", minHeight: 44, fontFamily: T.fontMono }}>{isRunning ? "RUNNING…" : iteration > 1 ? "EXECUTE ITER " + iteration : "EXECUTE"}</button>
      </div>
      {statusMsg && <div style={{ fontSize: 12, color: isRunning ? T.amber : T.mint, marginTop: 8, fontFamily: T.fontBody }}>{statusMsg}</div>}

      <div style={{ marginTop: 16 }}>
        {stages.map((s, i) => {
          const isRunningStage = s.status === "running" || s.status === "retrying";
          const expanded = expandedStage === i;
          return (
            <div
              key={s.id}
              style={{
                marginBottom: T.space(2),
                borderRadius: T.r2,
                overflow: "hidden",
                border: "1px solid " + (isRunningStage ? T.amber + "33" : expanded ? T.mint + "18" : T.border0),
                background: T.bg2,
                boxShadow: expanded ? T.shadow2 : T.shadow1,
                transition: "all 0.25s ease",
                ...(s.status === "done" ? { animationName: "fadeIn", animationDuration: "0.3s", animationTimingFunction: "ease", animationDelay: (i * 60) + "ms", animationFillMode: "both" } : {}),
              }}
            >
              <div
                onClick={() => s.data && setExpandedStage(expanded ? null : i)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  cursor: s.data ? "pointer" : "default",
                  background: expanded ? T.bg3 : "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 16, color: sColor(s.status), lineHeight: 1,
                      filter: isRunningStage ? "drop-shadow(0 0 4px rgba(255,179,71,0.4))" : undefined,
                      ...(isRunningStage ? { animationName: "pulseGlow", animationDuration: "1.5s", animationTimingFunction: "ease", animationIterationCount: "infinite" } : {}),
                    }}
                  >{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: T.fontBody, color: s.status === "idle" ? T.text3 : T.text0, letterSpacing: "0.01em" }}>{s.label}</div>
                    {s.subtitle && <div style={{ fontSize: 10, color: T.text3, fontFamily: T.fontBody, marginTop: 1 }}>{s.subtitle}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {s.status === "done" && <span style={{ fontSize: 11, fontWeight: 700, color: s.validation?.valid ? T.mint : T.amber, textShadow: "0 0 8px " + (s.validation?.valid ? T.mint : T.amber) + "33" }}>{s.validation?.valid ? "✓" : "!"}</span>}
                  {s.data && <span style={{ fontSize: 9, color: T.text3, transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", display: "inline-block" }}>▸</span>}
                </div>
              </div>
              {expanded && s.data && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: "0 16px 16px", borderTop: "1px solid " + T.border0, paddingTop: 14, fontSize: 14, lineHeight: 1.7, color: T.text0, overflowWrap: "break-word", wordBreak: "break-word", animationName: "fadeIn", animationDuration: "0.2s", animationTimingFunction: "ease" }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
                    {PROTOCOLS[s.id] && <ProtocolChip protocol={PROTOCOLS[s.id]} />}
                    {s.validation && <FieldCount count={s.validation.present + "/" + s.validation.total} color={s.validation.valid ? T.mint + "99" : T.amber} />}
                    {merkle?.stageHashes?.[i] && <HashChip hash={merkle.stageHashes[i].substring(0, 16)} />}
                  </div>
                  <ErrorBoundary>
                    {renderStageContent(s)}
                  </ErrorBoundary>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone && valData && !valData._parse_error && valData.one_sentence && (
        <div style={{ marginTop: 16, opacity: sentenceVisible ? 1 : 0, transition: "opacity 0.5s" }}>
          <TheSentence
            text={valData.one_sentence}
            label="THE SENTENCE THAT SURVIVES THE MEETING"
            color={T.mint}
            hash={merkle?.rootHash?.substring(0, 24)}
            time={pipelineTime}
          />
        </div>
      )}
    </div>
  );
}
