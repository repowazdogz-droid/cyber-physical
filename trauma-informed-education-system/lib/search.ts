import { getDocsIndex, DocItem } from "./docsIndex";

export interface SearchResult extends DocItem {
  score: number;
}

export function searchDocs(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const index = getDocsIndex();
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(t => t.length > 0);

  const results: SearchResult[] = [];

  for (const item of index) {
    let score = 0;
    const titleLower = (item.title ?? "").toLowerCase();
    const excerptLower = (item.excerpt ?? "").toLowerCase();
    const categoryLower = (item.category ?? "").toLowerCase();

    // Title matches are highest priority
    for (const term of terms) {
      if (titleLower.includes(term)) {
        score += 10;
      }
      // Exact title match
      if (titleLower === term) {
        score += 20;
      }
    }

    // Excerpt matches
    for (const term of terms) {
      if (excerptLower.includes(term)) {
        score += 5;
      }
    }

    // Category matches
    for (const term of terms) {
      if (categoryLower.includes(term)) {
        score += 2;
      }
    }

    if (score > 0) {
      results.push({ ...item, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}
























