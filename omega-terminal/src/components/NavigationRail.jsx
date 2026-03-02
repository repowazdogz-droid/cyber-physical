const PANEL_LABELS = {
  engines: { label: "Engines", icon: "◫" },
  design: { label: "Design", icon: "◇" },
  trust: { label: "Trust Stack", icon: "⬡" },
  integrity: { label: "Integrity", icon: "⟐" },
  signals: { label: "Signals", icon: "▸" },
};

export default function NavigationRail({ activePanel, onSelect, panels, collapsed, onToggleCollapse }) {
  return (
    <aside
      style={{
        width: collapsed ? 56 : 160,
        minWidth: collapsed ? 56 : 160,
        borderRight: "1px solid var(--border)",
        background: "var(--bg-card)",
        display: "flex",
        flexDirection: "column",
        alignItems: collapsed ? "center" : "flex-start",
        padding: "12px 0",
        transition: "width 0.2s",
      }}
    >
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand rail" : "Collapse rail"}
        style={{
          alignSelf: collapsed ? "center" : "flex-end",
          marginRight: collapsed ? 0 : 8,
          marginBottom: 8,
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 14,
          padding: 8,
        }}
      >
        {collapsed ? "▸" : "◂"}
      </button>
      {panels.map((id) => {
        const { label, icon } = PANEL_LABELS[id] || { label: id, icon: "•" };
        const isActive = activePanel === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: collapsed ? 40 : "100%",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: "12px " + (collapsed ? "8px" : "16px"),
              marginBottom: 4,
              background: isActive ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderLeft: isActive ? "2px solid var(--green)" : "2px solid transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 14 }}>{icon}</span>
            {!collapsed && <span>{label.toUpperCase()}</span>}
          </button>
        );
      })}
    </aside>
  );
}
