import type { OrientationState } from "../types/orientation";
import { encodeStateToHash, decodeStateFromHash } from "./compress";

export function makeShareUrl(state: OrientationState): string {
  const json = JSON.stringify(state);
  const payload = encodeStateToHash(json);
  const url = new URL(window.location.href);
  url.hash = `s=${payload}`;
  return url.toString();
}

function readStateFromUrlHashRaw(): string | null {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const match = hash.match(/s=([^&]+)/);
  if (!match) return null;

  const payload = match[1];
  if (payload.length > 100_000) return null; // hard guard

  const decoded = decodeStateFromHash(payload);
  return decoded;
}

export function readShareStateFromHash(): OrientationState | null {
  const decoded = readStateFromUrlHashRaw();
  if (!decoded) return null;

  try {
    return JSON.parse(decoded) as OrientationState;
  } catch {
    return null;
  }
}

export function clearShareHash(): void {
  const url = new URL(window.location.href);
  url.hash = "";
  window.history.replaceState({}, "", url.toString());
}

export function buildShareLinkFromState(args: { title: string; state: OrientationState }): string {
  const payload = JSON.stringify({ title: args.title, state: args.state });
  const encoded = encodeStateToHash(payload);
  const url = new URL(window.location.href);
  url.hash = `s=${encoded}`;
  return url.toString();
}

export function readStateFromUrlHash(): { title: string; state: OrientationState } | null {
  const decoded = readStateFromUrlHashRaw();
  if (!decoded) return null;
  
  // Try to parse as {title, state} or just state
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && parsed.state) {
      return { title: parsed.title || "Shared session", state: parsed.state };
    }
    return { title: "Shared session", state: parsed };
  } catch {
    return null;
  }
}

