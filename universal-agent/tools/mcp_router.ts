import Anthropic from "@anthropic-ai/sdk";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function extractQuery(input: any): string {
  if (typeof input === "string") return input;
  if (input.query && typeof input.query === "string") return input.query;
  const vals = Object.entries(input)
    .filter(
      ([k, v]) =>
        k !== "_identity" &&
        typeof v === "string" &&
        (v as string).length === 1,
    )
    .map(([_, v]) => v as string);
  if (vals.length > 0) return vals.join("");
  return JSON.stringify(input);
}

const client = new Anthropic();
const MOCK = process.env.MOCK_TOOLS === "true";

export async function callTool(tool: string, input: any): Promise<any> {
  // eslint-disable-next-line no-console
  console.log("[MCP call]", { tool, input });

  if (MOCK) {
    if (tool === "web.search")
      return {
        results: [
          {
            title: "FAA AC 20-107B: Composite Aircraft Structure",
            snippet: "Guidance for composite fatigue and damage tolerance.",
            url: "https://rgl.faa.gov",
          },
          {
            title: "ASTM D3039: Tensile Properties of Polymer Matrix Composites",
            snippet: "Standard test method for composite laminates.",
            url: "https://www.astm.org",
          },
        ],
      };
    if (tool === "drive.search")
      return {
        files: [
          {
            name: "Composite_Fuselage_Load_Analysis_v2.pdf",
            summary:
              "Safety factors: 1.5 ultimate, 1.15 limit. Fatigue spectrum included.",
          },
        ],
      };
    return { result: "ok", tool, input };
  }

  if (tool === "web.search") {
    const query = extractQuery(input);
    const response = await withTimeout(
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: `Search for: ${query}` }],
      }),
      60000,
      "web.search",
    );

    const results: any[] = [];
    for (const block of response.content) {
      if (block.type === "web_search_tool_result" || block.type === "text") {
        results.push(block);
      }
    }
    return { results, query };
  }

  if (tool === "drive.search") {
    return { files: [] };
  }

  return { result: "ok", tool, input };
}




