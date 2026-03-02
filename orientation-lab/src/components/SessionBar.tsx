import type { Session, SessionId } from "../types/session";

export function SessionBar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDuplicate,
  onRename,
  onDelete,
}: {
  sessions: Session[];
  activeId: SessionId | null;
  onSelect: (id: SessionId) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onRename: (id: SessionId, title: string) => void;
  onDelete: (id: SessionId) => void;
}) {
  return (
    <div style={wrap}>
      <div style={left}>
        <div style={label}>Session</div>
        <select
          value={activeId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          style={select}
        >
          {sessions.length === 0 ? (
            <option value="">No sessions</option>
          ) : (
            sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || "Untitled"} ·{" "}
                {new Date(s.updatedAt).toLocaleDateString()}
              </option>
            ))
          )}
        </select>
      </div>

      <div style={right}>
        <button onClick={onNew} style={btn}>
          New…
        </button>
        <button
          onClick={onDuplicate}
          style={btnSecondary}
          disabled={!activeId}
        >
          Duplicate
        </button>
        <button
          onClick={() => {
            if (!activeId) return;
            const current = sessions.find((s) => s.id === activeId);
            const nextTitle = window.prompt(
              "Rename session",
              current?.title ?? "Untitled"
            );
            if (nextTitle == null) return;
            onRename(activeId, nextTitle.trim() || "Untitled session");
          }}
          style={btnSecondary}
          disabled={!activeId}
        >
          Rename
        </button>
        <button
          onClick={() => {
            if (!activeId) return;
            const ok = window.confirm(
              "Delete this session?\n\nThis cannot be undone. (It will remove only this session, not others.)"
            );
            if (!ok) return;
            onDelete(activeId);
          }}
          style={dangerBtn}
          disabled={!activeId}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "10px 12px",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 12,
  background: "#fff",
  minWidth: 0,
  width: "100%",
};

const left: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 0,
  width: "100%",
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  fontWeight: 700,
  letterSpacing: 0.08,
  textTransform: "uppercase",
};

const select: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  fontSize: 13,
};

const right: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  width: "100%",
};

const btn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnSecondary: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #bbb",
  background: "#fff",
  color: "#111",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const dangerBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d33",
  background: "#fff",
  color: "#b00",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

