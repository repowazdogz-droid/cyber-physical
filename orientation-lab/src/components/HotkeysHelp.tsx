import { Card, Divider, Chip } from "./ui";

export function HotkeysHelp() {
  return (
    <Card title="Hotkeys (quiet)">
      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.45 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <Chip>Cmd/Ctrl + Z</Chip>
          <span>Undo last change</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <Chip>Esc</Chip>
          <span>Exit Room Mode</span>
        </div>
        <Divider />
        <div style={{ fontSize: 12, color: "#666" }}>
          Tip: In a room, project "Room Mode", and keep editing on your laptop.
        </div>
      </div>
    </Card>
  );
}

