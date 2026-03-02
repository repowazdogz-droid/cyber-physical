/**
 * OMEGA Trust Terminal — citation extraction and verification (SRC-N)
 */

export function extractCitations(text) {
  if (typeof text !== "string") return [];
  const m = text.match(/\bSRC-\d+\b/g);
  return m ? [...new Set(m)] : [];
}

export function extractAllCitations(obj) {
  const all = [];
  function walk(v) {
    if (typeof v === "string") {
      extractCitations(v).forEach((c) => { if (!all.includes(c)) all.push(c); });
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  }
  walk(obj);
  return all;
}

export function verifyCitations(stageData, corpus) {
  const cited = extractAllCitations(stageData);
  const ids = corpus.map((s) => s.id);
  const valid = cited.filter((c) => ids.includes(c));
  const phantom = cited.filter((c) => !ids.includes(c));
  const uncited = ids.filter((id) => !cited.includes(id));
  return {
    total_cited: cited.length,
    valid_citations: valid,
    phantom_citations: phantom,
    uncited_sources: uncited,
    coverage: ids.length > 0 ? Math.round((valid.length / ids.length) * 100) : 0,
    all_verified: phantom.length === 0,
  };
}
