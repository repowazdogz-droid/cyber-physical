import type { Session, SessionId, SessionStore } from "../types/session";
import type { OrientationState } from "../types/orientation";
import type { Template, TemplateId } from "./templates";
import { createId } from "./id";

export function makeNewSession(
  templateId: TemplateId,
  seed: OrientationState
): Session {
  const now = Date.now();
  return {
    id: createId("session") as SessionId,
    title: "Untitled session",
    createdAt: now,
    updatedAt: now,
    templateId,
    state: seed,
  };
}

export function upsertSession(
  store: SessionStore,
  next: Session
): SessionStore {
  const idx = store.sessions.findIndex((s) => s.id === next.id);
  const sessions =
    idx === -1
      ? [next, ...store.sessions]
      : store.sessions.map((s) => (s.id === next.id ? next : s));
  return { ...store, sessions };
}

export function deleteSession(
  store: SessionStore,
  id: SessionId
): SessionStore {
  const sessions = store.sessions.filter((s) => s.id !== id);
  const activeId =
    store.activeId === id ? sessions[0]?.id ?? null : store.activeId;
  return { ...store, sessions, activeId };
}

export function createBlankStore(): SessionStore {
  return {
    version: 1,
    activeId: null,
    sessions: [],
  };
}

export function createSessionFromTemplate(template: Template): Session {
  const now = Date.now();
  return {
    id: createId("session") as SessionId,
    title: template.name,
    createdAt: now,
    updatedAt: now,
    templateId: template.id,
    state: { ...template.seed },
  };
}

export function duplicateSession(session: Session): Session {
  const now = Date.now();
  return {
    ...session,
    id: createId("session") as SessionId,
    title: `${session.title} (copy)`,
    createdAt: now,
    updatedAt: now,
    state: JSON.parse(JSON.stringify(session.state)) as OrientationState,
  };
}

export function renameSession(session: Session, title: string): Session {
  return {
    ...session,
    title,
    updatedAt: Date.now(),
  };
}

export function touchSession(session: Session): Session {
  return {
    ...session,
    updatedAt: Date.now(),
  };
}

