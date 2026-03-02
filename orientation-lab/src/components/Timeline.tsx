import type { Session } from "../types/session";
import { Card } from "./ui";

export function Timeline({ session }: { session: Session }) {
  return (
    <Card title="Session timeline">
      <div style={{ fontSize: 13 }}>
        <div><b>Created:</b> {new Date(session.createdAt).toLocaleString()}</div>
        <div><b>Last updated:</b> {new Date(session.updatedAt).toLocaleString()}</div>
      </div>
    </Card>
  );
}

