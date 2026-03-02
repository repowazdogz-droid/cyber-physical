import { APP_NAME, APP_VERSION } from "./version";

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  const stamped = {
    __meta: {
      app: APP_NAME,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
    },
    data,
  };
  const text = JSON.stringify(stamped, null, 2);
  downloadTextFile(filename, text);
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function unwrapStampedJson(parsed: any): any | null {
  // Accept either {__meta, data} or raw data.
  if (!parsed) return null;
  if (typeof parsed === "object" && parsed.data) return parsed.data;
  return parsed;
}

export function wrapStampedJson(data: any): string {
  const stamped = {
    __meta: {
      app: APP_NAME,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
    },
    data,
  };
  return JSON.stringify(stamped, null, 2);
}

export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}
