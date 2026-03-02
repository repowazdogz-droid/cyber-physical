import React, { useEffect, useMemo, useState } from "react";
import "./styles/app.css";

import type { OrientationState } from "./types/orientation";
import type { SessionStore } from "./types/session";

import { Card, Button, Chip, Divider, SkipLink, Small } from "./components/ui";
import { PrimitiveEditor } from "./components/PrimitiveEditor";
import { TemplateChooser } from "./components/TemplateChooser";
import { SignalPanel } from "./components/SignalPanel";
import { ArtifactView } from "./components/ArtifactView";
import { ArtifactPack } from "./components/ArtifactPack";
import { RoomMode } from "./components/RoomMode";
import { HotkeysHelp } from "./components/HotkeysHelp";
import { FacilitatorNotes } from "./components/FacilitatorNotes";
import { Timeline } from "./components/Timeline";
import { V1Scope } from "./components/V1Scope";
import AboutPage from "./components/pages/AboutPage";
import HowToUsePage from "./components/pages/HowToUsePage";

import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useUndo } from "./hooks/useUndo";

import { defaultOrientationState } from "./utils/defaultState";
import { STORE_KEY } from "./utils/storeKeys";
import { getTemplate, type Template } from "./utils/templates";
import {
  createBlankStore,
  createSessionFromTemplate,
  duplicateSession,
  renameSession,
  deleteSession,
} from "./utils/sessions";
import { buildShareLinkFromState, readStateFromUrlHash } from "./utils/share";
import { wrapStampedJson, unwrapStampedJson, downloadTextFile, readTextFile } from "./utils/jsonIO";
import { getFlowStatuses } from "./utils/flow";
import { ErrorBoundary } from "./components/ErrorBoundary";

type TopPage = "flow" | "about" | "how";
type ViewMode = "edit" | "artifact";

const PAGE_KEY = "ol_last_page_v1";
const VISITED_KEY = "ol_visited_v1";

function getInitialPage(): TopPage {
  try {
    const visited = localStorage.getItem(VISITED_KEY);
    const saved = localStorage.getItem(PAGE_KEY) as TopPage | null;

    // First-ever visit: About (one-time)
    if (!visited) return "about";

    // Returning: last page if valid, otherwise Flow
    if (saved === "flow" || saved === "about" || saved === "how") return saved;
    return "flow";
  } catch {
    // If storage blocked, keep calm default
    return "about";
  }
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <Button variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open ? <div style={{ marginTop: 10 }}>{children}</div> : null}
    </Card>
  );
}

function StartHereCard() {
  return (
    <Card title="Start here">
      <Small>Make it usable in 60 seconds</Small>
      <ul style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.35 }}>
        <li><b>Capture 2–3 representations</b> (lenses).</li>
        <li><b>Name the live dispute</b> + what would settle it.</li>
        <li><b>Name what you can't yet know</b> + who owns finding out.</li>
      </ul>
      <div style={{ marginTop: 10 }}>
        <Small>No authority. No optimisation. No "answers".</Small>
      </div>
    </Card>
  );
}

function AppInner() {
  const [page, setPage] = useState<TopPage>(() => getInitialPage());
  const [view, setView] = useState<ViewMode>("edit");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showRoomMode, setShowRoomMode] = useState(false);

  // Advanced stays off by default.
  const [advanced, setAdvanced] = useState(false);

  const [store, setStore] = useLocalStorageState<SessionStore>(STORE_KEY, createBlankStore());

  // Mark "visited" and persist last page selection
  useEffect(() => {
    try {
      localStorage.setItem(VISITED_KEY, "1");
      localStorage.setItem(PAGE_KEY, page);
    } catch {
      // ignore
    }
  }, [page]);

  // Ensure we always have an active session
  useEffect(() => {
    if (!store.sessions.length) {
      const t = getTemplate("blank");
      const newSession = createSessionFromTemplate(t);
      setStore({ version: 1, sessions: [newSession], activeId: newSession.id });
    } else if (!store.activeId) {
      setStore((s) => ({ ...s, activeId: s.sessions[0]?.id ?? null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hash import (guarded in share.ts)
  useEffect(() => {
    const imported = readStateFromUrlHash();
    if (!imported) return;
    const ok = window.confirm(
      `Import shared orientation?\n\nTitle: ${imported.title || "Untitled"}\n\nThis will create a new session.`
    );
    if (!ok) return;

    setStore((prev) => {
      const t = getTemplate("blank");
      const next = createSessionFromTemplate(t);
      next.title = imported.title || "Imported session";
      next.state = imported.state;
      next.updatedAt = Date.now();
      return {
        ...prev,
        sessions: [next, ...prev.sessions],
        activeId: next.id,
      };
    });

    history.replaceState(null, "", window.location.pathname + window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSession = useMemo(() => {
    return store.sessions.find((s) => s.id === store.activeId) ?? store.sessions[0] ?? null;
  }, [store.activeId, store.sessions]);

  const activeState: OrientationState = activeSession?.state ?? defaultOrientationState;

  // Undo: restore by writing into active session
  const undo = useUndo<OrientationState>((v) => {
    if (!activeSession) return;
    setStore((prev) => {
      const idx = prev.sessions.findIndex((s) => s.id === activeSession.id);
      if (idx === -1) return prev;
      const sessions = [...prev.sessions];
      sessions[idx] = { ...sessions[idx], state: v, updatedAt: Date.now() };
      return { ...prev, sessions };
    });
  });

  function updateActiveState(next: React.SetStateAction<OrientationState>) {
    if (!activeSession) return;
    setStore((prev) => {
      const idx = prev.sessions.findIndex((s) => s.id === activeSession.id);
      if (idx === -1) return prev;

      const prevState = prev.sessions[idx].state;
      const resolved = typeof next === "function" ? (next as (p: OrientationState) => OrientationState)(prevState) : next;

      const sessions = [...prev.sessions];
      sessions[idx] = { ...sessions[idx], state: resolved, updatedAt: Date.now() };
      return { ...prev, sessions };
    });
  }

  function onBeforeChange(prevState: OrientationState) {
    undo.push(prevState);
  }

  // Flow signals (left rail)
  const flowStatuses = useMemo(() => getFlowStatuses(activeState), [activeState]);

  const hasAnyModel = (activeState.models?.length ?? 0) > 0;

  // Session actions
  function handleNewFromTemplate(t: Template) {
    const newSession = createSessionFromTemplate(t);
    setStore((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      activeId: newSession.id,
    }));
    setShowTemplates(false);
    setPage("flow");
    setView("edit");
  }

  function handleDuplicate() {
    if (!activeSession) return;
    const duped = duplicateSession(activeSession);
    setStore((prev) => ({
      ...prev,
      sessions: [duped, ...prev.sessions],
      activeId: duped.id,
    }));
  }

  function handleRename(id: string, title: string) {
    const session = store.sessions.find((s) => s.id === id);
    if (!session) return;
    const renamed = renameSession(session, title);
    setStore((prev) => {
      const idx = prev.sessions.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const sessions = [...prev.sessions];
      sessions[idx] = renamed;
      return { ...prev, sessions };
    });
  }

  function handleDelete() {
    if (!activeSession) return;
    setStore((prev) => deleteSession(prev, activeSession.id));
  }

  function handleSelectSession(id: string) {
    setStore((prev) => ({ ...prev, activeId: id }));
  }

  function copyShareLink() {
    const url = buildShareLinkFromState({ title: activeSession?.title || "Untitled", state: activeState });
    navigator.clipboard.writeText(url);
    alert("Share link copied.");
  }

  async function importJsonFile(file: File | null) {
    if (!file) return;
    const raw = await readTextFile(file);
    const parsed = unwrapStampedJson(raw);

    const ok = window.confirm(`Import JSON as a NEW session?\n\nTitle: ${parsed.title || "Imported session"}`);
    if (!ok) return;

    setStore((prev) => {
      const t = getTemplate("blank");
      const next = createSessionFromTemplate(t);
      next.title = parsed.title || "Imported session";
      next.state = parsed.state;
      next.updatedAt = Date.now();
      return {
        ...prev,
        sessions: [next, ...prev.sessions],
        activeId: next.id,
      };
    });

    // clear input
    const input = document.getElementById("importJson") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function exportJson() {
    const stamped = wrapStampedJson({
      title: activeSession?.title || "Untitled",
      state: activeState,
    });
    downloadTextFile(`orientation_${(activeSession?.title || "session").replace(/\s+/g, "_")}.json`, stamped);
  }

  const headerRight = (
    <div className="topNav">
      <Button onClick={() => setPage("flow")} variant={page === "flow" ? "primary" : "ghost"}>Flow</Button>
      <Button onClick={() => setPage("about")} variant={page === "about" ? "primary" : "ghost"}>About</Button>
      <Button onClick={() => setPage("how")} variant={page === "how" ? "primary" : "ghost"}>How to use</Button>
    </div>
  );

  return (
    <div className="appShell">
      <SkipLink />

      <header className="appHeader">
        <div className="appTitle">
          <h1>Orientation Lab</h1>
          <p>Structured orientation under uncertainty.</p>
        </div>
        {headerRight}
      </header>

      {page !== "flow" ? (
        <main id="main">
          {page === "about" ? <AboutPage /> : <HowToUsePage />}
        </main>
      ) : (
        <main id="main" className="mainGrid">
          {/* LEFT RAIL */}
          <div className="col">
            <div className="stack">
              <StartHereCard />

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 800 }}>Flow</div>
                  <Chip>Next: {flowStatuses.find((s) => !s.ready)?.label || "Pack"}</Chip>
                </div>
                <div style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontSize: 13 }}>
                  Capture → Discriminate → Own → Produce.
                </div>
                <Divider />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                  {flowStatuses.map((s) => (
                    <div key={s.step} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span>{s.label}</span>
                      <Chip>{s.ready ? "Ready" : "Not ready"}</Chip>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Session">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {activeSession?.title ?? "Untitled session"}
                    </div>
                    <Small>
                      {activeSession?.updatedAt ? new Date(activeSession.updatedAt).toLocaleString() : ""}
                    </Small>
                  </div>

                  <Button variant="ghost" onClick={() => setShowTemplates(true)}>New…</Button>
                </div>

                <Divider />

                {/* Compact actions (no duplicate heading, less noise) */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={handleDuplicate}>Duplicate</Button>
                  <Button variant="ghost" onClick={() => {
                    if (!activeSession) return;
                    const nextTitle = window.prompt("Rename session", activeSession.title);
                    if (!nextTitle) return;
                    handleRename(activeSession.id, nextTitle);
                  }}>Rename</Button>
                  <Button variant="ghost" onClick={handleDelete}>Delete</Button>
                </div>

                <Divider />

                {/* Session picker */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {store.sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      style={{
                        textAlign: "left",
                        border: "1px solid rgba(0,0,0,0.10)",
                        borderRadius: 10,
                        padding: "8px 10px",
                        background: s.id === store.activeId ? "rgba(0,0,0,0.04)" : "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </div>
                      <Small>{new Date(s.updatedAt).toLocaleDateString()}</Small>
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <div style={{ fontWeight: 800 }}>Tools</div>
                <Divider />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={() => { setView((v) => (v === "edit" ? "artifact" : "edit")); }}>
                    {view === "edit" ? "Artifact view" : "Back to editing"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRoomMode(true)}>Room mode</Button>
                  <Button variant="ghost" onClick={() => undo.undo()} disabled={!undo.canUndo()}>Undo</Button>
                  <Button variant="ghost" onClick={copyShareLink}>Copy share link</Button>
                </div>
                <Divider />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant="ghost" onClick={exportJson}>Export JSON</Button>
                  <label style={{ fontSize: 13, color: "rgba(0,0,0,0.62)" }}>
                    <input
                      id="importJson"
                      type="file"
                      accept="application/json"
                      onChange={(e) => importJsonFile(e.target.files?.[0] ?? null)}
                      style={{ display: "block", marginTop: 6 }}
                    />
                    <Small>Import creates a new session.</Small>
                  </label>
                </div>
              </Card>
            </div>
          </div>

          {/* CENTER */}
          <div className="col">
            <div className="stack">
              {view === "artifact" ? (
                <>
                  {activeSession && <ArtifactPack session={activeSession} state={activeState} />}
                  <ArtifactView state={activeState} />
                </>
              ) : (
                <>
                  <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 900 }}>Context</div>
                      <Chip>Neutral. No conclusion.</Chip>
                    </div>
                    <Divider />
                    <div style={{ display: "grid", gap: 10 }}>
                      <label style={{ fontSize: 13, color: "rgba(0,0,0,0.62)" }}>
                        Title
                        <input
                          value={activeState.title || ""}
                          onChange={(e) => updateActiveState((s) => ({ ...s, title: e.target.value }))}
                          placeholder="Short. Human. Specific."
                          style={{
                            width: "100%",
                            marginTop: 6,
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.10)",
                          }}
                        />
                      </label>

                      <label style={{ fontSize: 13, color: "rgba(0,0,0,0.62)" }}>
                        Situation context
                        <textarea
                          value={activeState.context || ""}
                          onChange={(e) => updateActiveState((s) => ({ ...s, context: e.target.value }))}
                          placeholder="Two–five sentences. No blame."
                          rows={4}
                          style={{
                            width: "100%",
                            marginTop: 6,
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.10)",
                            resize: "vertical",
                          }}
                        />
                      </label>

                      <Small><b>Start with models.</b> Everything else is downstream.</Small>
                    </div>
                  </Card>

                  {/* Models always "awake" */}
                  <PrimitiveEditor
                    state={activeState}
                    setState={updateActiveState}
                    onBeforeChange={onBeforeChange}
                    onUndo={() => undo.undo()}
                    focusSection="models"
                  />

                  {/* Everything else "sleepy" until at least one model exists */}
                  <div className={!hasAnyModel ? "sleepy" : ""}>
                    <PrimitiveEditor
                      state={activeState}
                      setState={updateActiveState}
                      onBeforeChange={onBeforeChange}
                      onUndo={() => undo.undo()}
                      focusSection="rest"
                    />
                    {!hasAnyModel ? (
                      <div className="sleepyHint">
                        Add one model first. The rest becomes easier once the room has at least one lens.
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col">
            <div className="stack">
              <CollapsibleSection title="Orientation signals" defaultOpen={false}>
                <SignalPanel state={activeState} />
              </CollapsibleSection>

              <CollapsibleSection title="Produce orientation" defaultOpen={false}>
                <Card>
                  <div style={{ fontWeight: 800 }}>Generate room pack</div>
                  <div style={{ marginTop: 8, color: "rgba(0,0,0,0.62)", fontSize: 13 }}>
                    A printable/shareable artifact: what is assumed, disputed, unknown, and owned.
                  </div>
                  <Divider />
                  <Button onClick={() => setView("artifact")}>Open pack</Button>
                </Card>
              </CollapsibleSection>

              <Card>
                <div style={{ color: "rgba(0,0,0,0.62)", fontSize: 13 }}>
                  Currently used as a thinking tool, not an operational system.
                </div>
              </Card>

              {advanced ? (
                <>
                  <CollapsibleSection title="Session timeline" defaultOpen={false}>
                    {activeSession && <Timeline session={activeSession} />}
                  </CollapsibleSection>

                  <CollapsibleSection title="Facilitator notes" defaultOpen={false}>
                    <FacilitatorNotes state={activeState} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Hotkeys" defaultOpen={false}>
                    <HotkeysHelp />
                  </CollapsibleSection>

                  <CollapsibleSection title="V1 scope" defaultOpen={false}>
                    <V1Scope />
                  </CollapsibleSection>
                </>
              ) : (
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>Advanced</div>
                    <Button variant="ghost" onClick={() => setAdvanced(true)}>Show</Button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "rgba(0,0,0,0.62)" }}>
                    Timeline, facilitation notes, hotkeys, and scope.
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Templates modal-ish */}
          {showTemplates ? (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", padding: 18, zIndex: 50 }}>
              <div style={{ maxWidth: 980, margin: "0 auto" }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>Start from a template</div>
                    <Button variant="ghost" onClick={() => setShowTemplates(false)}>Close</Button>
                  </div>
                  <Divider />
                  <TemplateChooser
                    onChoose={(t) => handleNewFromTemplate(t)}
                    onClose={() => setShowTemplates(false)}
                  />
                </Card>
              </div>
            </div>
          ) : null}

          {/* Room mode overlay */}
          {showRoomMode && activeSession ? (
            <RoomMode
              title={activeSession.title}
              state={activeState}
              onExit={() => setShowRoomMode(false)}
            />
          ) : null}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
