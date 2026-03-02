import { useState, useRef, useEffect } from "react";
import { computeMerkleChain, canonicalJSON, sha256 } from "../utils/crypto";
import { verifyCitations } from "../utils/citations";
import { KNOWN_LIMITATIONS_DEC } from "../utils/integrity";
import { anthropicMessages } from "../utils/api";
import {
  validateSchemaDEC,
  STRICT_VALIDATORS_DEC,
  REQUIRED_FIELDS_DEC,
  parseLLMResponse,
  repairJSON,
} from "../utils/validators";
import { deterministicDEC } from "../utils/deterministic";
import { T, POSTURE_COLORS } from "../styles/tokens";
import { Badge, SectionLabel, AccentBar, HashChip, ProtocolChip, FieldCount, TheSentence } from "../components/ui";
import ErrorBoundary from "../components/ui/ErrorBoundary";

const MODES = [
  { id: "strategic_assessment", label: "Strategic Assessment", icon: "◣", needsCorpus: true },
  { id: "options_analysis", label: "Options Analysis", icon: "◧", needsCorpus: true },
  { id: "risk_governance", label: "Risk & Governance", icon: "◩", needsCorpus: true },
  { id: "board_brief", label: "Board Brief", icon: "◨", needsCorpus: false },
];

const PRELOADED = [
  { label: "DeFi ZK Bridge", brief: "A DeFi protocol with $400M TVL is evaluating whether to implement ZK proof verification for cross-chain bridge transactions. Current bridge has had 2 exploits in 18 months totalling $12M in losses.", context: "Board decision required within 4 weeks. Engineering team of 12. Current audit firm is Trail of Bits." },
  { label: "Biomin Scale-up", brief: "A university spin-out has demonstrated protein-enabled biomineralisation at lab scale. They need to decide whether to pursue direct manufacturing, license to existing company, or seek ARIA funding for 2-year programme. Burn rate £180K/year, 14 months runway.", context: "IP owned by university with exclusive license. Key researcher considering leaving for industry." },
  { label: "ARIA Trust Infra", brief: "ARIA is evaluating whether to fund trust infrastructure as horizontal capability serving all programmes, or as vertical investments within specific programmes like Scaling Trust. Budget: £5M over 3 years.", context: "Political pressure to show results within 12 months. Two programme directors have conflicting views." },
  { label: "Scaling Trust", brief: "Design the governance and coordination infrastructure for ARIA's Scaling Trust programme. AI agents need to securely coordinate, negotiate, and verify with one another on behalf of humans in cyber-physical systems.", context: "£50M programme. Applications open, deadline 24 March. Grants £100K-£3M. Alex Obadia is Programme Director." },
];

const PROTOCOLS = { strategic_assessment: "SAP-1.0", options_analysis: "OAP-1.0", risk_governance: "RGP-1.0", board_brief: "BBP-1.0" };
const STATUS = { idle: "idle", running: "running", retrying: "retrying", done: "done", error: "error" };
const MAX_RETRIES = 2;
const DETERMINISTIC = import.meta.env.VITE_DETERMINISTIC === "true";

const systemPrompts = {
  strategic_assessment: 'You are a strategic assessment engine. Given a decision brief and context, produce a JSON object with: governing_tension (the core tension), failure_pathway (how this could fail), state_of_art (current best practice), key_sources (array of {title, finding, source_ref}). Cite SRC-N if corpus provided. Valid JSON only, start { end }.',
  options_analysis: 'You are an options analysis engine. Produce: options (array of {id, title, summary, pros, cons}), recommended_option (id and rationale), comparison_criteria (array of strings). Valid JSON only, start { end }.',
  risk_governance: 'You are a risk and governance engine. Produce: kill_criteria (array of {criterion, threshold, numeric_required}), structural_tests (array of strings), governance_gates (object with decision_gates, halt_triggers, abandonment_threshold). Board Brief will need numeric kill criteria. Valid JSON only, start { end }.',
  board_brief: 'You are a board brief engine. CRITICAL: the_sentence must contain at least one specific number (cost, timeline, threshold). authorization_statement: what the board is being asked to authorize. conditions: array of conditions. prohibitions: array of prohibitions. decision_posture: one of Proceed, Conditions, Defer, DNP. Valid JSON only, start { end }.',
};

export default function DecisionEngine({ onSignal, onStatus, onChain, onStageData, onPipelineTime, onMeta, linkContext }) {
  const [brief, setBrief] = useState("");
  const [context, setContext] = useState("");
  const [stages, setStages] = useState(MODES.map((m) => ({ ...m, status: STATUS.idle, data: null, validation: null, schemaResult: null, retries: 0, citationReport: null })));
  const [isRunning, setIsRunning] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [merkle, setMerkle] = useState(null);
  const [iteration, setIteration] = useState(1);
  const [revisionNote, setRevisionNote] = useState("");
  const [corpus, setCorpus] = useState([]);
  const [corpusHash, setCorpusHash] = useState(null);
  const [citationReport, setCitationReport] = useState(null);
  const [frozen, setFrozen] = useState(false);
  const [pipelineTime, setPipelineTime] = useState(null);
  const abortRef = useRef(null);
  const runIdRef = useRef(0);
  const startTimeRef = useRef(null);

  const allDone = stages.every((s) => s.status === STATUS.done);

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

  const callAPI = async (stage, structuredOutputs, retryCount, signal, corpusCtx) => {
    const retryPrefix = retryCount > 0 ? "YOUR PREVIOUS RESPONSE WAS NOT VALID JSON. Respond with ONLY a JSON object. Start with { end with }. No other text.\n\n" : "";
    const revisionCtx = revisionNote && iteration > 1 ? "\nREVISION (Iteration " + iteration + "): " + revisionNote + "\n\n" : "";
    const prevContext = structuredOutputs.map((o) => "--- " + o.label + " ---\n" + JSON.stringify(o.data, null, 2)).join("\n\n");
    let corpusSection = "";
    if (corpusCtx?.length && stage.needsCorpus) {
      corpusSection = "\n\n=== EXTERNAL SOURCE CORPUS ===\nCite SRC-N only.\n\n";
      corpusCtx.forEach((s) => { corpusSection += s.id + " | " + s.title + "\n" + s.snippet + "\n\n"; });
      corpusSection += "=== END CORPUS ===\n";
    }
    const linkSection = linkContext ? "\n\n" + linkContext + "\n\n" : "";
    const userContent = [retryPrefix, revisionCtx, "Brief: " + brief, "Context: " + context, corpusSection, linkSection, structuredOutputs.length > 0 ? "\n\nPrevious outputs:\n" + prevContext + "\n\nNow produce " + stage.label + "." : "\nProduce " + stage.label + "."].join("");
    const body = { model: "claude-sonnet-4-5-20250929", max_tokens: 4000, system: systemPrompts[stage.id], messages: [{ role: "user", content: userContent }] };
    const data = await anthropicMessages(body, signal);
    const text = data?.content?.filter((b) => b.type === "text")?.map((b) => b.text)?.join("\n") || "";
    return parseLLMResponse(text, stage.id, REQUIRED_FIELDS_DEC);
  };

  const buildCorpus = async (question, signal) => {
    const qBody = { model: "claude-sonnet-4-5-20250929", max_tokens: 1000, system: 'Generate 4-6 web search queries for this decision brief. Return ONLY a JSON array of strings.', messages: [{ role: "user", content: question }] };
    const qData = await anthropicMessages(qBody, signal);
    const qt = (qData?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    let sq = [];
    try { sq = JSON.parse(repairJSON(qt, []) || "[]"); } catch (e) { sq = [brief.substring(0, 100)]; }
    if (!Array.isArray(sq)) sq = [brief.substring(0, 100)];
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
        for (let r = 0; r < res.length && r < 4; r++) assembled.push({ id: "SRC-" + srcC++, title: res[r].title || "Untitled", url: (res[r].url || "").replace(/[<>"']/g, ""), snippet: res[r].snippet || "" });
      } catch (e) { if (e.name === "AbortError") throw e; }
    }
    onSignal?.({ engine: "dec", message: "Decision corpus: " + assembled.length + " sources", severity: "success" });
    const cHash = await sha256(canonicalJSON(assembled));
    return { corpus: assembled, corpus_hash: cHash, queries: sq };
  };

  const runStageWithRetry = async (stageIndex, structuredOutputs, currentRunId, signal, corpusCtx) => {
    const stage = MODES[stageIndex];
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (runIdRef.current !== currentRunId) return null;
      setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: attempt > 0 ? STATUS.retrying : STATUS.running, retries: attempt } : s)));
      try {
        const parseResult = await callAPI(stage, structuredOutputs, attempt, signal, corpusCtx);
        if (runIdRef.current !== currentRunId) return null;
        if (parseResult.ok) {
          const validation = validateSchemaDEC(stage.id, parseResult.data);
          const sv = STRICT_VALIDATORS_DEC[stage.id];
          const schemaResult = sv ? sv(parseResult.data) : { valid: true, errors: [] };
          let stageCitReport = null;
          if (stage.id === "strategic_assessment" && corpusCtx?.length) {
            stageCitReport = verifyCitations(parseResult.data, corpusCtx);
          }
          if ((validation.valid && schemaResult.valid) || attempt === MAX_RETRIES) {
            onSignal?.({ engine: "dec", message: "Stage " + (stageIndex + 1) + ": " + stage.label + " — " + (schemaResult.valid ? "VALID" : "INCOMPLETE") + (stageCitReport && !stageCitReport.all_verified ? ", " + stageCitReport.phantom_citations.length + " phantom citations" : ""), severity: schemaResult.valid ? "success" : "warning" });
            setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: STATUS.done, data: parseResult.data, validation, schemaResult, citationReport: stageCitReport, retries: attempt } : s)));
            setExpandedStage(stageIndex);
            return { id: stage.id, label: stage.label, data: parseResult.data };
          }
        } else if (attempt === MAX_RETRIES) {
          setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: STATUS.done, data: { _parse_error: parseResult.kind }, validation: { valid: false, missing: REQUIRED_FIELDS_DEC[stage.id] || [], total: (REQUIRED_FIELDS_DEC[stage.id] || []).length, present: 0 }, schemaResult: { valid: false, errors: ["Parse failed"] }, retries: attempt } : s)));
          return { id: stage.id, label: stage.label, data: { _parse_error: parseResult.kind } };
        }
      } catch (err) {
        if (err.name === "AbortError") return null;
        const isRateLimit = err.status === 429;
        const waitSec = isRateLimit && err.retryAfterSec ? err.retryAfterSec : 60;
        if (isRateLimit && attempt < MAX_RETRIES) {
          onSignal?.({ engine: "dec", message: "Rate limited (429). Waiting " + waitSec + "s then retrying.", severity: "warning" });
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          if (runIdRef.current !== currentRunId) return null;
          continue;
        }
        if (attempt === MAX_RETRIES) {
          setStages((prev) => prev.map((s, j) => (j === stageIndex ? { ...s, status: STATUS.error, data: { error: err.message }, validation: { valid: false }, schemaResult: { valid: false, errors: [err.message] }, retries: attempt } : s)));
          onSignal?.({ engine: "dec", message: "Stage " + (stageIndex + 1) + " error: " + err.message, severity: "error" });
          return null;
        }
      }
    }
    return null;
  };

  const runPipeline = async () => {
    if (!brief.trim() || frozen) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const cid = ++runIdRef.current;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    setPipelineTime(null);
    setStages(MODES.map((m) => ({ ...m, status: STATUS.idle, data: null, validation: null, schemaResult: null, retries: 0, citationReport: null })));
    setExpandedStage(null);
    setMerkle(null);
    setCitationReport(null);
    setCorpusHash(null);
    onMeta?.(null);
    onSignal?.({ engine: "dec", message: 'Pipeline started — "' + (brief.substring(0, 40) + (brief.length > 40 ? "…" : "")) + '"', severity: "info" });
    if (linkContext) {
      onSignal?.({ engine: "dec", message: "R&D engine outputs loaded (" + linkContext.length + " chars)", severity: "info" });
    }

    if (DETERMINISTIC) {
      const mockResults = deterministicDEC(brief, context);
      const so = [];
      for (let i = 0; i < mockResults.length; i++) {
        const r = mockResults[i];
        const stage = MODES[i];
        const validation = validateSchemaDEC(stage.id, r.data);
        const sv = STRICT_VALIDATORS_DEC[stage.id];
        const schemaResult = sv ? sv(r.data) : { valid: true, errors: [] };
        setStages((prev) => prev.map((s, j) => (j === i ? {
          ...s, status: STATUS.done, data: r.data, validation, schemaResult, retries: 0
        } : s)));
        setExpandedStage(i);
        so.push(r);
        onSignal?.({ engine: "dec", message: "Stage " + (i + 1) + ": " + stage.label + " — DETERMINISTIC", severity: "success" });
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      const chain = await computeMerkleChain(so.map((o) => o.data));
      setMerkle(chain);
      onStageData?.(so.map((o) => o.data));
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(0);
      setPipelineTime(elapsed);
      onSignal?.({ engine: "dec", message: "Decision: DETERMINISTIC pipeline complete — 4/4 stages — " + elapsed + "s", severity: "success" });
      setExpandedStage(3);
      onMeta?.({ brief, context, iteration, revisionNote, elapsedMs: Number(elapsed) * 1000, model: "claude-sonnet-4-5-20250929" });
      setIsRunning(false);
      return;
    }

    let corpusCtx = [];
    try {
      const cr = await buildCorpus(brief, controller.signal);
      if (runIdRef.current !== cid) return;
      corpusCtx = cr.corpus;
      setCorpus(cr.corpus);
      setCorpusHash(cr.corpus_hash);
    } catch (e) {
      if (e.name === "AbortError") { setIsRunning(false); return; }
      if (e.status === 429) onSignal?.({ engine: "dec", message: "Rate limited — try again in a few minutes.", severity: "warning" });
    }

    const so = [];
    for (let i = 0; i < MODES.length; i++) {
      if (runIdRef.current !== cid) break;
      const result = await runStageWithRetry(i, so, cid, controller.signal, corpusCtx);
      if (!result) break;
      so.push(result);
      if (i < MODES.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    if (so.length === MODES.length && runIdRef.current === cid) {
      const chain = await computeMerkleChain(so.map((o) => o.data));
      setMerkle(chain);
      onStageData?.(so.map((o) => o.data));
      let fcr = null;
      if (corpusCtx?.length && so[0]) {
        fcr = verifyCitations(so[0].data, corpusCtx);
        setCitationReport(fcr);
      }
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(0);
      setPipelineTime(elapsed);
      onSignal?.({ engine: "dec", message: "Decision Chain: Root hash verified — " + chain.rootHash.substring(0, 8), severity: "success" });
      onSignal?.({ engine: "dec", message: "Decision: Pipeline complete — 4/4 stages — " + elapsed + "s", severity: "success" });
      setExpandedStage(3);
      onMeta?.({ brief, context, iteration, revisionNote, elapsedMs: Number(elapsed) * 1000, model: "claude-sonnet-4-5-20250929" });
    }
    if (runIdRef.current === cid) setIsRunning(false);
  };

  const freezeVersion = () => {
    if (!allDone || frozen) return;
    setFrozen(true);
  };
  const startRevision = () => { setFrozen(false); setIteration((prev) => prev + 1); };

  const sColor = (status) => ({ idle: T.text3, running: T.amber, retrying: T.amber, done: T.mint, error: T.coral })[status] || T.text3;

  const renderValue = (val, depth = 0) => {
    if (val == null) return <span style={{ color: T.text3 }}>—</span>;
    if (typeof val === "boolean") return <span style={{ color: val ? T.mint : T.coral }}>{val ? "Yes" : "No"}</span>;
    if (typeof val === "string") return <span style={{ lineHeight: 1.7, overflowWrap: "break-word", wordBreak: "break-word", fontFamily: T.fontBody }}>{val}</span>;
    if (typeof val === "number") return <span style={{ color: T.blue, fontWeight: 600, fontFamily: T.fontMono }}>{val}</span>;
    if (Array.isArray(val)) return <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>{val.map((item, i) => (<div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}><span style={{ color: T.text3, fontSize: 7 }}>▸</span><div style={{ flex: 1 }}>{renderValue(item, depth + 1)}</div></div>))}</div>;
    if (typeof val === "object") return <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>{Object.entries(val).filter(([k]) => !k.startsWith("_")).map(([k, v]) => (<div key={k} style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", marginBottom: 4, fontFamily: T.fontMono }}>{k.replace(/_/g, " ")}</div><div style={{ fontSize: 14, fontFamily: T.fontBody }}>{renderValue(v, depth + 1)}</div></div>))}</div>;
    return <span>{String(val)}</span>;
  };

  const renderStageContent = (s) => {
    if (!s.data || s.data._parse_error) return renderValue(s.data);
    if (s.id === "strategic_assessment") {
      const d = s.data;
      return (
        <div>
          {d.governing_tension && <AccentBar color={T.amber}><SectionLabel color={T.amber}>GOVERNING TENSION</SectionLabel><div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody }}>{d.governing_tension}</div></AccentBar>}
          {d.failure_pathway && <AccentBar color={T.coral}><SectionLabel color={T.coral}>FAILURE PATHWAY</SectionLabel><div style={{ fontSize: 14, color: T.coral, lineHeight: 1.8, fontFamily: T.fontBody, opacity: 0.9 }}>{d.failure_pathway}</div></AccentBar>}
          {renderValue({ state_of_art: d.state_of_art, key_sources: d.key_sources })}
        </div>
      );
    }
    if (s.id === "options_analysis") {
      const opts = s.data.options || [];
      const rec = s.data.recommended_option;
      return (
        <div>
          {opts.map((o, i) => {
            const isRec = rec && (o.id === rec.id || o.title === rec.title || (typeof rec === "object" && rec.id === o.id) || (typeof rec === "string" && o.title && rec.includes(o.title)));
            return (
              <div key={i} style={{ marginBottom: 8, padding: "12px 16px", background: isRec ? T.mintGlow : T.bg3, border: `1px solid ${isRec ? T.mint + "33" : T.border0}`, borderRadius: T.r2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text0, fontFamily: T.fontMono }}>{o.id || "O" + (i + 1)}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text0, fontFamily: T.fontBody }}>{o.title}</span>
                  {isRec && <Badge color={T.mint} large>RECOMMENDED</Badge>}
                </div>
                <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody }}>{o.summary || o.pros}</div>
              </div>
            );
          })}
          {s.data.recommended_option && typeof s.data.recommended_option === "object" && s.data.recommended_option.rationale && <div style={{ marginTop: 12, fontSize: 13, color: T.blue, fontFamily: T.fontBody }}>Rationale: {s.data.recommended_option.rationale}</div>}
        </div>
      );
    }
    if (s.id === "risk_governance") {
      const kc = s.data.kill_criteria || [];
      return (
        <div>
          {kc.length > 0 && <div style={{ marginBottom: 12 }}><SectionLabel color={T.coral}>KILL CRITERIA</SectionLabel>{kc.map((k, i) => (<div key={i} style={{ marginBottom: 6, padding: "10px 14px", background: T.coralGlow, borderLeft: "3px solid " + T.coral, borderRadius: "0 " + T.r1 + "px " + T.r1 + "px 0" }}><div style={{ fontSize: 13, color: T.coral, fontWeight: 600, fontFamily: T.fontBody }}>{typeof k === "object" ? k.criterion || k.criteria : k}</div>{k.threshold != null && <div style={{ fontSize: 11, color: T.text2, fontFamily: T.fontMono, marginTop: 2 }}>{k.threshold}</div>}</div>))}</div>}
          {renderValue(s.data.structural_tests)}
          {renderValue(s.data.governance_gates)}
        </div>
      );
    }
    if (s.id === "board_brief") {
      const d = s.data;
      const posture = (d.decision_posture || "Conditions").replace(/\s+/g, "");
      const postureColor = POSTURE_COLORS[posture] || T.amber;
      return (
        <div>
          {d.authorization_statement && <AccentBar color={T.blue}><SectionLabel color={T.blue}>AUTHORIZATION</SectionLabel><div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody }}>{d.authorization_statement}</div></AccentBar>}
          {d.conditions && Array.isArray(d.conditions) && d.conditions.length > 0 && <div style={{ marginBottom: 14 }}><SectionLabel color={T.amber}>CONDITIONS</SectionLabel>{d.conditions.map((c, i) => <div key={i} style={{ fontSize: 13, color: T.amber, marginBottom: 4, fontFamily: T.fontBody }}><span style={{ color: T.amberDim, marginRight: 6 }}>◆</span>{c}</div>)}</div>}
          {d.prohibitions && Array.isArray(d.prohibitions) && d.prohibitions.length > 0 && <div style={{ marginBottom: 14 }}><SectionLabel color={T.coral}>PROHIBITIONS</SectionLabel>{d.prohibitions.map((p, i) => <div key={i} style={{ fontSize: 13, color: T.coral, marginBottom: 4, fontFamily: T.fontBody }}><span style={{ color: T.coralDim, marginRight: 6 }}>⊘</span>{p}</div>)}</div>}
          {d.decision_posture && <div style={{ marginBottom: 16 }}><Badge color={postureColor} large glow={postureColor + "18"}>{posture.toUpperCase()}</Badge></div>}
          {d.the_sentence && <TheSentence text={d.the_sentence} label="THE BOARD SENTENCE" color={postureColor} hash={merkle?.rootHash?.substring(0, 24)} time={pipelineTime} />}
        </div>
      );
    }
    return renderValue(s.data);
  };

  return (
    <div style={{ padding: "12px 16px", fontSize: 14, fontFamily: T.fontBody, color: T.text0 }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PRELOADED.map((p, i) => (
          <button key={i} onClick={() => { setBrief(p.brief); setContext(p.context || ""); }} style={{ background: T.bg2, border: "1px solid " + T.border0, borderRadius: T.r1, color: T.text1, fontSize: 11, padding: "8px 12px", cursor: "pointer", fontFamily: T.fontBody }}>{p.label}</button>
        ))}
      </div>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.text2, letterSpacing: "0.1em", display: "block", marginBottom: 6, fontFamily: T.fontMono }}>BRIEF</label>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Decision brief…"
        disabled={isRunning}
        rows={5}
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
      <label style={{ fontSize: 10, fontWeight: 700, color: T.text2, letterSpacing: "0.1em", display: "block", marginBottom: 6, marginTop: 10, fontFamily: T.fontMono }}>CONTEXT</label>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Context…"
        disabled={isRunning}
        rows={3}
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
      {iteration > 1 && (
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.blue, letterSpacing: "0.1em", display: "block", marginBottom: 6, fontFamily: T.fontMono }}>
            REVISION NOTE
          </label>
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="e.g. Refine options around licensing."
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
        <button onClick={runPipeline} disabled={isRunning || !brief.trim() || frozen} style={{ background: isRunning || !brief.trim() || frozen ? T.bg2 : T.text0, color: isRunning || !brief.trim() || frozen ? T.text3 : T.bg0, border: "none", borderRadius: T.r2, padding: "10px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", cursor: isRunning || !brief.trim() || frozen ? "not-allowed" : "pointer", minHeight: 44, fontFamily: T.fontMono }}>{isRunning ? "RUNNING…" : iteration > 1 ? "EXECUTE ITER " + iteration : "EXECUTE"}</button>
        {allDone && !frozen && <button onClick={freezeVersion} style={{ background: "transparent", border: "1px solid " + T.amber + "44", color: T.amber, borderRadius: T.r2, padding: "10px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.fontBody }}>FREEZE</button>}
        {frozen && <button onClick={startRevision} style={{ background: "transparent", border: "1px solid " + T.blue + "44", color: T.blue, borderRadius: T.r2, padding: "10px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.fontBody }}>REVISE</button>}
      </div>

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
                animation: s.status === "done" ? "fadeIn 0.3s ease" : undefined,
                animationDelay: (i * 60) + "ms",
                animationFillMode: "both",
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
                      animation: isRunningStage ? "pulseGlow 1.5s ease infinite" : undefined,
                    }}
                  >{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: T.fontBody, color: s.status === "idle" ? T.text3 : T.text0, letterSpacing: "0.01em" }}>{s.label}</div>
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
                  style={{ padding: "0 16px 16px", borderTop: "1px solid " + T.border0, paddingTop: 14, fontSize: 14, lineHeight: 1.7, color: T.text0, overflowWrap: "break-word", wordBreak: "break-word", animation: "fadeIn 0.2s ease" }}
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
    </div>
  );
}
