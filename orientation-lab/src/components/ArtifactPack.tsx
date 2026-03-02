import { useMemo } from "react";
import type { Session } from "../types/session";
import type { OrientationState } from "../types/orientation";
import { buildPackHtml, buildPackText } from "../utils/artifactPack";
import { Card, Button } from "./ui";

export function ArtifactPack({
  session,
  state,
}: {
  session: Session;
  state: OrientationState;
}) {
  const packText = useMemo(() => {
    if (!session.createdAt || !session.updatedAt) return "";
    return buildPackText({ title: session.title, createdAt: session.createdAt, updatedAt: session.updatedAt, state });
  }, [session, state]);

  const onCopyText = async () => {
    if (!packText) return;
    await navigator.clipboard.writeText(packText);
    alert("Pack text copied.");
  };

  const onPrint = () => {
    if (!session.createdAt || !session.updatedAt) {
      alert("Session metadata missing. Cannot print pack.");
      return;
    }
    const html = buildPackHtml({ title: session.title, createdAt: session.createdAt, updatedAt: session.updatedAt, state });
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!w) {
      alert("Popup blocked. Allow popups to print the pack.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Card
      title="Artifact pack (printable)"
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={onCopyText}>
            Copy pack text
          </Button>
          <Button onClick={onPrint}>Print pack</Button>
        </div>
      }
    >
      <div style={{ fontSize: 12, color: "#666" }}>
        One-page print view: header → signals summary → artifact text. No recommendations.
      </div>
    </Card>
  );
}

