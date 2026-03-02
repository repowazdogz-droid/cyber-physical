import { useState, useRef } from "react";

// ============================================================
// RESIDENTIAL CARE — CASE NOTES VALIDATOR
// Observation-grounded. Bias-aware. Evidence-linked.
// ============================================================

const BIAS_PATTERNS = [
  { pattern: /always|never|every time|constantly|repeatedly/gi, type: "ABSOLUTE LANGUAGE", severity: "high", suggestion: "Replace with specific frequency: 'On 3 occasions this week' or 'During Tuesday's session'" },
  { pattern: /aggressive|violent|manipulative|attention.?seeking|defiant|disruptive|problematic|difficult|challenging behaviour/gi, type: "LABELLING", severity: "high", suggestion: "Describe the specific behaviour observed, not a character label. What did the child actually do?" },
  { pattern: /seems like|I think|I feel|I believe|in my opinion|obviously|clearly/gi, type: "SUBJECTIVE INFERENCE", severity: "medium", suggestion: "State what was observed or what the child said. Remove the interpretation layer." },
  { pattern: /refused|refused to|wouldn't|won't cooperate|non.?compliant/gi, type: "COMPLIANCE FRAMING", severity: "medium", suggestion: "Reframe: 'X chose not to...' or 'When asked to X, [child] said/did Y'. Describe the child's response, not their compliance." },
  { pattern: /bad mood|moody|sulking|having a tantrum|kicked off|lost it|blew up/gi, type: "INFORMAL / DISMISSIVE", severity: "medium", suggestion: "Use precise emotional language: 'appeared distressed', 'expressed frustration by...', 'became visibly upset when...'" },
  { pattern: /normal|abnormal|weird|strange|odd|bizarre/gi, type: "NORMALCY JUDGEMENT", severity: "high", suggestion: "Avoid framing behaviour as normal/abnormal. Describe what happened and the context." },
  { pattern: /lazy|ungrateful|rude|sneaky|sly|devious|naughty/gi, type: "CHARACTER JUDGEMENT", severity: "high", suggestion: "This attributes character traits rather than describing behaviour. What specific action did you observe?" },
  { pattern: /(?:he|she|they) (?:is|are) (?:a |an )?(?:bully|liar|troublemaker|handful|nightmare)/gi, type: "IDENTITY LABELLING", severity: "high", suggestion: "Labels define a child by behaviour. Describe the specific incident without labelling identity." },
  { pattern: /(?:for no reason|out of nowhere|unprovoked|without cause)/gi, type: "MISSING CONTEXT", severity: "medium", suggestion: "Behaviour always has context. If the trigger isn't known, state that: 'The preceding events were not observed' rather than implying there was no reason." },
  { pattern: /should have|needs to learn|needs to understand|must start/gi, type: "PRESCRIPTIVE", severity: "low", suggestion: "Case notes record what happened, not what should happen. Save recommendations for care plan reviews." },
  { pattern: /attention.?seeking/gi, type: "REDUCTIVE FRAMING", severity: "high", suggestion: "A child seeking attention is communicating a need. Reframe: 'sought interaction by...' or 'appeared to want connection with staff when...'" },
  { pattern: /(?:the|this) child|the young person|the resident/gi, type: "DEPERSONALISATION", severity: "low", suggestion: "Use the child's first name throughout. 'The child' creates clinical distance." }
];

const EVIDENCE_TYPES = {
  observed: { label: "OBSERVED BEHAVIOUR", color: "#4ade80", icon: "👁", description: "Something you directly saw the child do" },
  verbalised: { label: "CHILD'S OWN WORDS", color: "#60a5fa", icon: "💬", description: "Something the child said, in their words" },
  reported: { label: "REPORTED BY OTHERS", color: "#f59e0b", icon: "📋", description: "Information from another staff member, teacher, or professional" },
  contextual: { label: "CONTEXTUAL FACTOR", color: "#a78bfa", icon: "📍", description: "Environmental or situational context relevant to the note" }
};

const QUALITY_THRESHOLDS = {
  excellent: { min: 85, label: "EXCELLENT", color: "#4ade80", message: "This note is well-evidenced, objective, and child-centred." },
  good: { min: 65, label: "GOOD", color: "#a3e635", message: "Solid note with minor areas for improvement." },
  needs_work: { min: 40, label: "NEEDS IMPROVEMENT", color: "#f59e0b", message: "This note contains subjective language or unsupported statements." },
  poor: { min: 0, label: "REQUIRES REVISION", color: "#f87171", message: "Significant bias or subjectivity detected. Revise before filing." }
};

function analyseNote(text) {
  const flags = [];
  for (const bp of BIAS_PATTERNS) {
    const matches = text.match(bp.pattern);
    if (matches) {
      matches.forEach(match => {
        const idx = text.toLowerCase().indexOf(match.toLowerCase());
        flags.push({
          match: match,
          type: bp.type,
          severity: bp.severity,
          suggestion: bp.suggestion,
          position: idx
        });
      });
    }
  }
  return flags;
}

function computeScore(flags, evidenceItems, noteText) {
  if (!noteText.trim()) return 0;
  let score = 100;
  for (const f of flags) {
    if (f.severity === "high") score -= 15;
    else if (f.severity === "medium") score -= 8;
    else score -= 3;
  }
  if (evidenceItems.length === 0 && noteText.length > 50) score -= 20;
  const hasObserved = evidenceItems.some(e => e.type === "observed");
  const hasVerbalised = evidenceItems.some(e => e.type === "verbalised");
  if (hasObserved) score += 5;
  if (hasVerbalised) score += 5;
  if (evidenceItems.length >= 2) score += 5;
  return Math.max(0, Math.min(100, score));
}

function getQualityLevel(score) {
  if (score >= QUALITY_THRESHOLDS.excellent.min) return QUALITY_THRESHOLDS.excellent;
  if (score >= QUALITY_THRESHOLDS.good.min) return QUALITY_THRESHOLDS.good;
  if (score >= QUALITY_THRESHOLDS.needs_work.min) return QUALITY_THRESHOLDS.needs_work;
  return QUALITY_THRESHOLDS.poor;
}

function highlightText(text, flags) {
  if (!flags.length) return [{ text, highlighted: false }];
  const sorted = [...flags].sort((a, b) => a.position - b.position);
  const segments = [];
  let lastEnd = 0;
  for (const flag of sorted) {
    const start = text.toLowerCase().indexOf(flag.match.toLowerCase(), lastEnd);
    if (start === -1) continue;
    if (start > lastEnd) segments.push({ text: text.substring(lastEnd, start), highlighted: false });
    segments.push({ text: text.substring(start, start + flag.match.length), highlighted: true, flag });
    lastEnd = start + flag.match.length;
  }
  if (lastEnd < text.length) segments.push({ text: text.substring(lastEnd), highlighted: false });
  return segments;
}

const EXAMPLE_NOTES = [
  {
    label: "Before — Subjective",
    childName: "Jamie",
    text: "Jamie was in a bad mood all day and refused to do anything. He was being aggressive with the other kids for no reason and kicked off at dinner time. He's always like this on Mondays. He needs to learn to control his temper.",
    evidence: [],
    reflections: ""
  },
  {
    label: "After — Evidence-based",
    childName: "Jamie",
    text: "During the after-school period (15:45-17:00), Jamie was quieter than he had been over the weekend. When asked if he'd like to join the group activity, Jamie said 'I don't want to be around anyone right now.' Staff acknowledged this and offered the quiet room. At 16:20, Jamie pushed his chair back from the dinner table and left the room. Staff member Sarah followed after two minutes. Jamie was sitting in the hallway and said 'I hate Mondays because I have to think about the weekend ending.' Sarah sat with him for ten minutes. At 16:30, Jamie returned to the kitchen and asked to help clear up. He engaged calmly with two other young people while doing so.",
    evidence: [
      { type: "verbalised", text: "Jamie said: 'I don't want to be around anyone right now'" },
      { type: "verbalised", text: "Jamie said: 'I hate Mondays because I have to think about the weekend ending'" },
      { type: "observed", text: "Jamie was quieter than over the weekend during after-school period (15:45-17:00)" },
      { type: "observed", text: "At 16:20 Jamie pushed his chair back from dinner table and left the room" },
      { type: "observed", text: "Jamie was sitting in the hallway when staff member Sarah found him after two minutes" },
      { type: "observed", text: "At 16:30 Jamie returned to kitchen and asked to help clear up" },
      { type: "observed", text: "Jamie engaged calmly with two other young people while clearing up" },
      { type: "contextual", text: "Monday — first day back after weekend contact" }
    ],
    reflections: "Jamie seems to find the transition from weekends difficult. His comment about 'thinking about the weekend ending' might suggest he finds the shift between home and the unit unsettling. Worth raising at next keyworker session — could we build in a Monday transition routine? Sarah's calm approach worked well here. He responded to being given space and then came back on his own terms."
  }
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CaseNotesValidator() {
  const [childName, setChildName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [newEvidence, setNewEvidence] = useState({ type: "observed", text: "" });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [reflections, setReflections] = useState("");
  const noteRef = useRef(null);

  const flags = analyseNote(noteText);
  const score = computeScore(flags, evidenceItems, noteText);
  const quality = getQualityLevel(score);
  const segments = highlightText(noteText, flags);

  const addEvidence = () => {
    if (!newEvidence.text.trim()) return;
    setEvidenceItems(prev => [...prev, { ...newEvidence, id: Date.now() }]);
    setNewEvidence({ type: newEvidence.type, text: "" });
  };

  const removeEvidence = (id) => {
    setEvidenceItems(prev => prev.filter(e => e.id !== id));
  };

  const loadExample = (example) => {
    setChildName(example.childName);
    setNoteText(example.text);
    setEvidenceItems(example.evidence.map((e, i) => ({ ...e, id: Date.now() + i })));
    setReflections(example.reflections || "");
    setShowAnalysis(true);
  };

  const exportNote = () => {
    const timestamp = new Date().toISOString();
    let md = "# CASE NOTE — " + (childName || "Unnamed") + "\n\n";
    md += "**Date:** " + new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + "\n";
    md += "**Quality Score:** " + score + "/100 (" + quality.label + ")\n\n";
    md += "---\n\n";
    md += "## Note\n\n" + noteText + "\n\n";
    if (evidenceItems.length > 0) {
      md += "## Evidence Base\n\n";
      evidenceItems.forEach(e => {
        const et = EVIDENCE_TYPES[e.type];
        md += "- **" + et.label + ":** " + e.text + "\n";
      });
      md += "\n";
    }
    if (reflections.trim()) {
      md += "## Worker Reflections\n\n";
      md += "*The following is the worker's professional interpretation and is clearly separated from the factual record above.*\n\n";
      md += reflections + "\n\n";
    }
    if (flags.length > 0) {
      md += "## Flags Identified\n\n";
      flags.forEach(f => {
        md += "- **" + f.type + "** (" + f.severity + "): \"" + f.match + "\" — " + f.suggestion + "\n";
      });
      md += "\n";
    }
    md += "---\n*Validated by Case Notes Validator at " + timestamp + "*\n";

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "case-note-" + (childName || "note").toLowerCase().replace(/\s+/g, "-") + "-" + new Date().toISOString().split("T")[0] + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityColor = (s) => s === "high" ? "#f87171" : s === "medium" ? "#f59e0b" : "#60a5fa";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #faf9f7 0%, #f0ede8 100%)",
      color: "#2a2520",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      margin: 0, padding: 0
    }}>
      {/* Header */}
      <div style={{
        background: "#2a2520",
        padding: "28px 36px 24px",
        borderBottom: "4px solid #c4a882"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#c4a882", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 8 }}>
              RESIDENTIAL CARE
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 400, margin: 0, color: "#faf9f7", lineHeight: 1.2 }}>
              Case Notes Validator
            </h1>
            <p style={{ fontSize: 14, color: "#a09080", margin: "8px 0 0", fontStyle: "italic", maxWidth: 500 }}>
              Observation-grounded. Bias-aware. Evidence-linked.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowGuide(!showGuide)} style={{
              background: "transparent", border: "1px solid #c4a88244", color: "#c4a882",
              borderRadius: 6, padding: "8px 16px", fontSize: 12, cursor: "pointer",
              fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 600, letterSpacing: "0.05em"
            }}>
              {showGuide ? "HIDE GUIDE" : "WRITING GUIDE"}
            </button>
          </div>
        </div>
      </div>

      {/* Writing Guide */}
      {showGuide && (
        <div style={{
          background: "#2a2520", borderBottom: "1px solid #3a3530",
          padding: "0 36px 28px"
        }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#c4a882", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 14 }}>
              GOOD CASE NOTES ARE
            </div>
            {[
              { title: "Factual", desc: "Record what happened, not what you think about it. 'Jamie threw his plate' not 'Jamie was being aggressive'." },
              { title: "Specific", desc: "Include times, durations, and context. 'At 15:30 during homework time' not 'in the afternoon'." },
              { title: "Evidence-linked", desc: "Every statement should connect to something observed or something the child said." },
              { title: "Child-centred", desc: "Use their name. Record their words. Describe their experience, not just their compliance." },
              { title: "Free of labels", desc: "Describe behaviour, never character. The child is not 'aggressive' — they 'hit the table with their fist'." }
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 12, paddingLeft: 16, borderLeft: "2px solid #c4a88233" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#faf9f7" }}>{item.title}.</span>
                <span style={{ fontSize: 13, color: "#a09080", marginLeft: 8 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 36px 80px" }}>
        {/* Examples */}
        <div style={{ marginBottom: 28, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif" }}>EXAMPLES:</span>
          {EXAMPLE_NOTES.map((ex, i) => (
            <button key={i} onClick={() => loadExample(ex)} style={{
              background: "#fff", border: "1px solid #d4c8b8", borderRadius: 6,
              color: "#5a4a3a", fontSize: 12, padding: "6px 14px", cursor: "pointer",
              fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 500,
              transition: "all 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>{ex.label}</button>
          ))}
        </div>

        {/* Child Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 8
          }}>CHILD'S FIRST NAME</label>
          <input
            value={childName} onChange={e => setChildName(e.target.value)}
            placeholder="e.g. Jamie"
            style={{
              width: "100%", maxWidth: 300, boxSizing: "border-box",
              background: "#fff", border: "1px solid #d4c8b8", borderRadius: 8,
              color: "#2a2520", fontSize: 16, padding: "12px 16px",
              fontFamily: "'Georgia', serif", outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          />
        </div>

        {/* Note Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 8
          }}>CASE NOTE</label>
          <textarea
            ref={noteRef}
            value={noteText} onChange={e => { setNoteText(e.target.value); setShowAnalysis(false); }}
            placeholder={"Write your case note here...\n\nDescribe what you observed, what the child said and did, the context, and any actions taken by staff."}
            rows={8}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#fff", border: "1px solid #d4c8b8", borderRadius: 8,
              color: "#2a2520", fontSize: 15, padding: "16px 18px", lineHeight: 1.7,
              fontFamily: "'Georgia', serif", resize: "vertical", outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          />
        </div>

        {/* Evidence Section */}
        <div style={{
          marginBottom: 28, padding: "24px 28px",
          background: "#fff", borderRadius: 10,
          border: "1px solid #d4c8b8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 16 }}>
            EVIDENCE BASE
          </div>
          <p style={{ fontSize: 13, color: "#8a7a6a", margin: "0 0 18px", fontStyle: "italic" }}>
            Link your note to specific observations, the child's own words, or reports from others.
          </p>

          {/* Evidence type selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {Object.entries(EVIDENCE_TYPES).map(([key, et]) => (
              <button
                key={key}
                onClick={() => setNewEvidence(prev => ({ ...prev, type: key }))}
                style={{
                  background: newEvidence.type === key ? et.color + "18" : "transparent",
                  border: "1px solid " + (newEvidence.type === key ? et.color + "66" : "#d4c8b8"),
                  borderRadius: 6, padding: "8px 14px", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, color: newEvidence.type === key ? et.color : "#8a7a6a",
                  fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "0.03em",
                  transition: "all 0.2s"
                }}
              >
                {et.icon} {et.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input
              value={newEvidence.text}
              onChange={e => setNewEvidence(prev => ({ ...prev, text: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") addEvidence(); }}
              placeholder={EVIDENCE_TYPES[newEvidence.type]?.description || "Describe the evidence..."}
              style={{
                flex: 1, background: "#faf9f7", border: "1px solid #d4c8b8", borderRadius: 8,
                color: "#2a2520", fontSize: 14, padding: "10px 14px",
                fontFamily: "'Georgia', serif", outline: "none"
              }}
            />
            <button onClick={addEvidence} style={{
              background: "#2a2520", color: "#faf9f7", border: "none", borderRadius: 8,
              padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "0.08em",
              whiteSpace: "nowrap"
            }}>ADD</button>
          </div>

          {/* Evidence items */}
          {evidenceItems.length === 0 ? (
            <div style={{ fontSize: 13, color: "#b4a898", fontStyle: "italic", padding: "8px 0" }}>
              No evidence linked yet. Strong case notes have at least one observation and one record of the child's own words.
            </div>
          ) : (
            <div>
              {evidenceItems.map(item => {
                const et = EVIDENCE_TYPES[item.type];
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10,
                    padding: "12px 16px", background: et.color + "08",
                    borderLeft: "3px solid " + et.color, borderRadius: "0 8px 8px 0"
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{et.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: et.color, letterSpacing: "0.1em", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 4 }}>
                        {et.label}
                      </div>
                      <div style={{ fontSize: 14, color: "#2a2520", lineHeight: 1.5 }}>{item.text}</div>
                    </div>
                    <button onClick={() => removeEvidence(item.id)} style={{
                      background: "transparent", border: "none", color: "#c4a882", cursor: "pointer",
                      fontSize: 16, padding: "0 4px", flexShrink: 0, lineHeight: 1
                    }}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Worker Reflections */}
        <div style={{
          marginBottom: 28, padding: "24px 28px",
          background: "#fff", borderRadius: 10,
          border: "1px solid #b8c4d4",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#6a7a8a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 6 }}>
            WORKER REFLECTIONS
          </div>
          <p style={{ fontSize: 13, color: "#8a7a6a", margin: "0 0 14px", fontStyle: "italic" }}>
            Your thoughts, interpretations, and professional judgement go here — separate from the factual record. This is where you can say what you think and why.
          </p>
          <textarea
            value={reflections}
            onChange={e => setReflections(e.target.value)}
            placeholder={"What do you think was behind the child's behaviour today?\nAny patterns you're noticing?\nWhat worked well? What would you do differently?\nAnything to raise at the next team meeting or keyworker session?"}
            rows={5}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#f8f9fb", border: "1px solid #c8d0dc", borderRadius: 8,
              color: "#2a2520", fontSize: 15, padding: "16px 18px", lineHeight: 1.7,
              fontFamily: "'Georgia', serif", resize: "vertical", outline: "none"
            }}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: "#8a9aaa", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>ℹ️</span>
            <span>Reflections are clearly labelled as worker interpretation, not objective record. This protects both you and the child.</span>
          </div>
        </div>

        {/* Validate Button */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => setShowAnalysis(true)} disabled={!noteText.trim()} style={{
            background: !noteText.trim() ? "#d4c8b8" : "#2a2520",
            color: !noteText.trim() ? "#a09080" : "#faf9f7",
            border: "none", borderRadius: 8, padding: "14px 32px",
            fontSize: 14, fontWeight: 700, cursor: !noteText.trim() ? "not-allowed" : "pointer",
            fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "0.1em",
            boxShadow: noteText.trim() ? "0 2px 8px rgba(42,37,32,0.15)" : "none",
            transition: "all 0.2s"
          }}>VALIDATE NOTE</button>
        </div>

        {/* Analysis Results */}
        {showAnalysis && noteText.trim() && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Quality Score */}
            <div style={{
              marginBottom: 28, padding: "28px 32px",
              background: "#fff", borderRadius: 12,
              border: "2px solid " + quality.color + "44",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: quality.color, fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 6 }}>
                    {quality.label}
                  </div>
                  <div style={{ fontSize: 14, color: "#5a4a3a", lineHeight: 1.5 }}>{quality.message}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 42, fontWeight: 300, color: quality.color, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: 11, color: "#a09080", fontFamily: "'Helvetica Neue', sans-serif" }}>/ 100</div>
                </div>
              </div>
              {/* Score bar */}
              <div style={{ marginTop: 20, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: score + "%", height: "100%", borderRadius: 3,
                  background: quality.color, transition: "width 0.8s ease"
                }} />
              </div>
              {/* Quick stats */}
              <div style={{ display: "flex", gap: 24, marginTop: 18, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: flags.filter(f => f.severity === "high").length > 0 ? "#f87171" : "#4ade80", fontWeight: 700 }}>
                    {flags.filter(f => f.severity === "high").length}
                  </span>
                  <span style={{ color: "#a09080", marginLeft: 6 }}>high severity</span>
                </div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: flags.filter(f => f.severity === "medium").length > 0 ? "#f59e0b" : "#4ade80", fontWeight: 700 }}>
                    {flags.filter(f => f.severity === "medium").length}
                  </span>
                  <span style={{ color: "#a09080", marginLeft: 6 }}>medium severity</span>
                </div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: "#60a5fa", fontWeight: 700 }}>{evidenceItems.length}</span>
                  <span style={{ color: "#a09080", marginLeft: 6 }}>evidence items</span>
                </div>
              </div>
            </div>

            {/* Highlighted Text */}
            {flags.length > 0 && (
              <div style={{
                marginBottom: 28, padding: "24px 28px",
                background: "#fff", borderRadius: 10,
                border: "1px solid #d4c8b8",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 16 }}>
                  YOUR NOTE — FLAGGED LANGUAGE HIGHLIGHTED
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.8, color: "#2a2520" }}>
                  {segments.map((seg, i) => (
                    seg.highlighted ? (
                      <span key={i} style={{
                        background: severityColor(seg.flag.severity) + "22",
                        borderBottom: "2px solid " + severityColor(seg.flag.severity),
                        padding: "2px 4px", borderRadius: 3,
                        cursor: "help"
                      }} title={seg.flag.type + ": " + seg.flag.suggestion}>
                        {seg.text}
                      </span>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Individual Flags */}
            {flags.length > 0 && (
              <div style={{
                marginBottom: 28, padding: "24px 28px",
                background: "#fff", borderRadius: 10,
                border: "1px solid #d4c8b8",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 16 }}>
                  FLAGS ({flags.length})
                </div>
                {flags.map((f, i) => (
                  <div key={i} style={{
                    marginBottom: 14, padding: "14px 18px",
                    background: severityColor(f.severity) + "08",
                    borderLeft: "3px solid " + severityColor(f.severity),
                    borderRadius: "0 8px 8px 0"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        color: severityColor(f.severity),
                        fontFamily: "'Helvetica Neue', sans-serif",
                        border: "1px solid " + severityColor(f.severity) + "44",
                        borderRadius: 4, padding: "2px 8px"
                      }}>{f.severity.toUpperCase()}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#5a4a3a" }}>{f.type}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#5a4a3a", marginBottom: 6 }}>
                      Found: <span style={{ fontStyle: "italic", color: severityColor(f.severity) }}>"{f.match}"</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#8a7a6a", lineHeight: 1.5 }}>
                      {f.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence Assessment */}
            <div style={{
              marginBottom: 28, padding: "24px 28px",
              background: "#fff", borderRadius: 10,
              border: "1px solid #d4c8b8",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#8a7a6a", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 16 }}>
                EVIDENCE ASSESSMENT
              </div>
              {evidenceItems.length === 0 ? (
                <div style={{
                  padding: "20px 24px", background: "#f87171" + "08",
                  borderLeft: "3px solid #f87171", borderRadius: "0 8px 8px 0"
                }}>
                  <div style={{ fontSize: 14, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>No evidence linked</div>
                  <div style={{ fontSize: 13, color: "#8a7a6a", lineHeight: 1.5 }}>
                    This note has no linked observations or quotes from the child. Every case note should be supported by at least one piece of direct evidence — something you saw or something the child said.
                  </div>
                </div>
              ) : (
                <div>
                  {!evidenceItems.some(e => e.type === "observed") && (
                    <div style={{ marginBottom: 12, padding: "12px 16px", background: "#f59e0b08", borderLeft: "3px solid #f59e0b", borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontSize: 13, color: "#f59e0b" }}>No direct observation linked. Consider adding what you personally witnessed.</div>
                    </div>
                  )}
                  {!evidenceItems.some(e => e.type === "verbalised") && (
                    <div style={{ marginBottom: 12, padding: "12px 16px", background: "#60a5fa08", borderLeft: "3px solid #60a5fa", borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontSize: 13, color: "#60a5fa" }}>No record of the child's own words. If the child said anything relevant, include it in their words.</div>
                    </div>
                  )}
                  {evidenceItems.some(e => e.type === "observed") && evidenceItems.some(e => e.type === "verbalised") && (
                    <div style={{ padding: "12px 16px", background: "#4ade8008", borderLeft: "3px solid #4ade80", borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>Good evidence base. Note includes both direct observation and the child's own words.</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export */}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={exportNote} style={{
                background: "#2a2520", color: "#faf9f7", border: "none", borderRadius: 8,
                padding: "12px 24px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "0.08em",
                boxShadow: "0 2px 8px rgba(42,37,32,0.15)"
              }}>EXPORT NOTE</button>
              <button onClick={() => { setNoteText(""); setEvidenceItems([]); setChildName(""); setReflections(""); setShowAnalysis(false); }} style={{
                background: "transparent", border: "1px solid #d4c8b8", color: "#8a7a6a",
                borderRadius: 8, padding: "12px 24px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: "0.08em"
              }}>CLEAR</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #d4c8b8", background: "#f0ede8",
        padding: "14px 36px", display: "flex", justifyContent: "space-between",
        alignItems: "center", fontSize: 11, color: "#a09080",
        fontFamily: "'Helvetica Neue', sans-serif"
      }}>
        <span>Case Notes Validator — Observation-grounded. Bias-aware. Evidence-linked.</span>
        <span>Every child deserves accurate recording.</span>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus, textarea:focus {
          border-color: #c4a882 !important;
          box-shadow: 0 0 0 3px rgba(196, 168, 130, 0.1) !important;
        }
        button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
