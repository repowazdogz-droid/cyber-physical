"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DocItem } from "@/lib/docsIndex";

function searchDocs(query: string, allItems: DocItem[]): DocItem[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(t => t.length > 0);

  const results: Array<DocItem & { score: number }> = [];

  for (const item of allItems) {
    let score = 0;
    const titleLower = (item.title ?? "").toLowerCase();
    const excerptLower = (item.excerpt ?? "").toLowerCase();
    const categoryLower = (item.category ?? "").toLowerCase();

    for (const term of terms) {
      if (titleLower.includes(term)) {
        score += 10;
      }
      if (titleLower === term) {
        score += 20;
      }
      if (excerptLower.includes(term)) {
        score += 5;
      }
      if (categoryLower.includes(term)) {
        score += 2;
      }
    }

    if (score > 0) {
      results.push({ ...item, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

interface Props {
  allItems: DocItem[];
}

export default function SearchContent({ allItems }: Props) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(searchDocs(initialQuery, allItems));

  useEffect(() => {
    setResults(searchDocs(query, allItems));
  }, [query, allItems]);

  return (
    <>
      <h1>Search Documentation</h1>
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search docs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 500 }}
          autoFocus
        />
      </div>

      {query.trim() ? (
        results.length > 0 ? (
          <div>
            <p className="small" style={{ marginBottom: 16 }}>
              Found {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>
            <div className="card-grid">
              {results.map((item) => (
                <Link key={item.slug} href={item.path ?? item.slug} className="card-item">
                  <div className="pill pill-category">{item.category}</div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="small">No results found for &quot;{query}&quot;.</p>
            <p className="small" style={{ marginTop: 8 }}>
              Try different keywords or <Link href="/docs">browse all docs</Link>.
            </p>
          </div>
        )
      ) : (
        <div className="card">
          <p className="small">Enter a search query to find documentation.</p>
          <p className="small" style={{ marginTop: 8 }}>
            Or <Link href="/docs">browse all docs</Link>.
          </p>
        </div>
      )}
    </>
  );
}
