export function extractJson(text: string): any {
  if (typeof text !== "string") {
    throw new Error("Input to extractJson must be a string");
  }

  // First, attempt to parse the entire string as JSON
  try {
    return JSON.parse(text);
  } catch {
    // fall through to regex-based extraction
  }

  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error("No JSON object found in text");
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error("Failed to parse JSON from extracted block");
  }
}

