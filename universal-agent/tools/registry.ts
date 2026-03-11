export interface ToolSpec {
  name: string;
  maxCallsPerRun?: number;
}

const DEFAULT_TOOLS: ToolSpec[] = [
  { name: "gmail.search", maxCallsPerRun: 10 },
  { name: "calendar.list", maxCallsPerRun: 10 },
  { name: "gmail.send", maxCallsPerRun: 3 },
  { name: "drive.search", maxCallsPerRun: 10 },
  { name: "web.search", maxCallsPerRun: 20 },
];

export function listTools(): ToolSpec[] {
  return [...DEFAULT_TOOLS];
}

export function getToolSpec(name: string): ToolSpec | undefined {
  return DEFAULT_TOOLS.find((t) => t.name === name);
}

