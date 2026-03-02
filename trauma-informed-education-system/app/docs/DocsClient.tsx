"use client";

import { useState } from "react";
import Link from "next/link";
import { DocItem } from "@/lib/docsIndex";
import { Card } from "../components/Page";

interface Props {
  allItems: DocItem[];
  categories: string[];
  recommended: DocItem[];
}

export default function DocsClient({ allItems, categories, recommended }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = selectedCategory
    ? allItems.filter((item) => item.category === selectedCategory)
    : allItems;

  return (
    <div className="space-y-6">
      {recommended.length > 0 && (
        <Card>
          <div className="kicker mb-2">Recommended Reading Path</div>
          <div className="flex flex-wrap gap-2 mt-3">
            {recommended.map((item) => (
              <Link key={item.slug} href={item.path ?? item.slug} className="pill hover:bg-muted/70">
                {item.title}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={selectedCategory === null ? "btn-primary" : "btn-secondary"}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat ? "btn-primary" : "btn-secondary"}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Link key={item.slug} href={item.path ?? item.slug} className="card card-pad hover:opacity-95">
              <div className="pill mb-2">{item.category}</div>
              <div className="h2">{item.title}</div>
              <div className="sub mt-1">{item.excerpt}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

