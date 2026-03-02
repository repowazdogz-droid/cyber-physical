"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const DEEP_THOUGHT_SILENCE_MS = 15_000;
const HINT_AFFORDANCE_AFTER_MS = 20_000;

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [input, setInput] = useState("");
  const [commitPrediction, setCommitPrediction] = useState(false);
  const [deepThoughtActive, setDeepThoughtActive] = useState(false);
  const [showHintAffordance, setShowHintAffordance] = useState(false);
  const [auditProbe, setAuditProbe] = useState<{ purpose: string; testing: string } | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkSilence = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= HINT_AFFORDANCE_MS) setShowHintAffordance(true);
      else if (elapsed >= DEEP_THOUGHT_SILENCE_MS) setDeepThoughtActive(true);
    };
    silenceTimerRef.current = setInterval(checkSilence, 2000);
    return () => {
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const recordActivity = () => {
    lastActivityRef.current = Date.now();
    setDeepThoughtActive(false);
    setShowHintAffordance(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    recordActivity();
    setMessages((m) => [...m, { role: "user", text }]);

    const res = await fetch(`/api/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, commitPrediction }),
    });
    const data = await res.json().catch(() => ({}));
    const reply = data.reply ?? "I’m here. Say more about that.";
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
    if (data.probePurpose) setAuditProbe({ purpose: data.probePurpose, testing: data.probeTesting ?? "" });
  };

  const resetFrame = () => {
    recordActivity();
    setCommitPrediction(false);
    setAuditProbe(null);
  };

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          ← Exit
        </button>
        <button
          type="button"
          onClick={resetFrame}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
        >
          Reset frame
        </button>
      </div>

      <div className="flex-1 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === "user" ? "text-right" : ""}
          >
            <span className="inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] bg-[var(--surface)] border border-[var(--border)]">
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {deepThoughtActive && (
        <div className="flex items-center gap-2 text-[var(--muted)] text-sm py-1">
          <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-pulse" />
          <span>Thinking</span>
        </div>
      )}
      {showHintAffordance && (
        <div className="py-1 flex justify-center">
          <span className="w-8 h-1 rounded-full bg-[var(--border)]" title="You can keep typing or wait" />
        </div>
      )}

      <div className="pt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={commitPrediction}
            onChange={(e) => setCommitPrediction(e.target.checked)}
          />
          Commit prediction
        </label>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); recordActivity(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Your reasoning…"
            className="flex-1 min-h-[80px] px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
          />
          <button
            type="button"
            onClick={sendMessage}
            className="self-end px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)] text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {auditProbe && (
        <details className="mt-4 pt-4 border-t border-[var(--border)]">
          <summary className="text-sm text-[var(--muted)] cursor-pointer hover:text-[var(--text)]">
            Why did you ask that?
          </summary>
          <div className="mt-2 text-sm text-[var(--muted)] space-y-1">
            <p><strong className="text-[var(--accent)]">Purpose:</strong> {auditProbe.purpose}</p>
            <p><strong className="text-[var(--accent)]">Testing:</strong> {auditProbe.testing}</p>
          </div>
        </details>
      )}
    </main>
  );
}
