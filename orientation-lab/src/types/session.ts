import type { OrientationState } from "./orientation";
import type { TemplateId } from "../utils/templates";

export type SessionId = string;

export type SessionMeta = {
  id: SessionId;
  title: string;
  createdAt: number;
  updatedAt: number;
  templateId: TemplateId;
};

export type Session = SessionMeta & {
  state: OrientationState;
};

export type SessionStore = {
  version: 1;
  activeId: SessionId | null;
  sessions: Session[];
};

