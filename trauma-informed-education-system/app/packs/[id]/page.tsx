"use client";

import { use } from "react";
import Link from "next/link";
import { getPack } from "@/lib/packs";
import { useState } from "react";
import { Page, Card } from "../../components/Page";

export default function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pack = getPack(id);
  const [copied, setCopied] = useState(false);

  if (!pack) {
    return (
      <Page title="Pack not found">
        <Card>
          <p className="sub">
            No pack with ID &quot;{id}&quot;. <Link href="/packs" className="text-primary hover:underline">Browse all packs</Link>.
          </p>
        </Card>
      </Page>
    );
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Page
      title={pack.title}
      subtitle={pack.description}
      actions={
        <>
          <a className="btn-secondary" href={`/packs/${pack.id}/print`}>Print / Save PDF</a>
          <button className="btn-primary" type="button" onClick={handleCopyLink}>
            {copied ? "✓ Copied!" : "Copy link"}
          </button>
        </>
      }
    >
      <Card>
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="pill">{pack.audience}</div>
          <div className="pill">{pack.duration}</div>
          {(pack.id === "leadership-60min" || pack.id === "staff-60min") && (
            <div className="pill bg-primary/10 text-primary border-primary/20">recommended</div>
          )}
        </div>

        <div className="prose">
          <div className="kicker mb-2">Use this pack when</div>
          <p className="sub">
            You need a curated set of documents for {pack.audience} with {pack.duration} available. Share the print link or use it yourself.
          </p>
        </div>

        <div className="pt-4 border-t mt-4">
          <div className="h2 mb-3">Contents</div>
          <ol className="list-decimal pl-5 space-y-1">
            {pack.items.map((item, idx) => (
              <li key={idx}>
                <Link href={item.href} className="text-primary hover:underline">{item.title}</Link>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </Page>
  );
}
