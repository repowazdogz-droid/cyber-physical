import { getDocsIndex, getCategories } from "@/lib/docsIndex";
import DocsClient from "./DocsClient";
import { PageFrame } from "@/app/components/PageFrame";

const RECOMMENDED_PATH = [
  "foundations/principles",
  "framework/pillars",
  "framework/process-maps",
  "delivery/modules/module-01-foundations",
  "governance/safeguarding",
];

export default function DocsIndex() {
  const allItems = getDocsIndex();
  const categories = getCategories();
  const recommended = allItems.filter((item) =>
    RECOMMENDED_PATH.some(path => item.slug === `/docs/${path}` || item.path === `/docs/${path}`)
  );

  return (
    <PageFrame variant="docs" title="Docs" subtitle="Browse the canonical library. Use Packs + Training if you don't have time to read long documents.">
      <DocsClient allItems={allItems} categories={categories} recommended={recommended} />
    </PageFrame>
  );
}
