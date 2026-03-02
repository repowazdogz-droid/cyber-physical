"use client";

import { useState } from "react";
import Link from "next/link";
import { PACKS, Pack, PackItem } from "@/lib/packs";
import { Page, Card } from "../components/Page";

type Role = "leadership" | "staff" | "parents" | null;
type Time = "5min" | "20min" | "60min" | null;
type Intent = "safety" | "processes" | "modules" | "inspection" | null;

const INTENT_MAP: Record<string, PackItem[]> = {
  safety: [
    { title: "Safeguarding boundaries", href: "/docs/governance/safeguarding" },
    { title: "Refusal boundaries", href: "/docs/governance/refusal-boundaries" },
    { title: "Claims discipline", href: "/docs/evidence/claims-discipline" },
  ],
  processes: [
    { title: "Process maps", href: "/docs/framework/process-maps" },
    { title: "Repair processes", href: "/docs/delivery/modules/module-04-repair-boundaries" },
    { title: "Responding to stress", href: "/docs/delivery/modules/module-06-responding-to-stress" },
  ],
  modules: [
    { title: "Module 01: Foundations", href: "/docs/delivery/modules/module-01-foundations" },
    { title: "Module 02: Leadership Systems", href: "/docs/delivery/modules/module-02-leadership-systems" },
    { title: "Module 03: Classroom Predictability", href: "/docs/delivery/modules/module-03-classroom-predictability" },
    { title: "Module 09: Neurodivergence", href: "/docs/delivery/modules/module-09-neurodivergence" },
    { title: "Module 10: Trauma-Informed Practice", href: "/docs/delivery/modules/module-10-trauma-informed-practice" },
    { title: "Module 11: When Trauma Meets Neurodivergence", href: "/docs/delivery/modules/module-11-when-trauma-meets-neurodivergence" },
  ],
  inspection: [
    { title: "Inspection framing", href: "/docs/delivery/inspection-framing" },
    { title: "Claims discipline", href: "/docs/evidence/claims-discipline" },
    { title: "Core offer", href: "/docs/business/core-offer" },
  ],
};

export default function StartWizard() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [time, setTime] = useState<Time>(null);
  const [intent, setIntent] = useState<Intent>(null);

  const getRecommendedPack = (): Pack | null => {
    if (!role || !time) return null;
    const packId = `${role}-${time}`;
    return PACKS.find((p) => p.id === packId) || null;
  };

  const getIntentLinks = () => {
    if (!intent) return [];
    return INTENT_MAP[intent] || [];
  };

  const handleNext = () => {
    if (step === 1 && role) setStep(2);
    else if (step === 2 && time) setStep(3);
    else if (step === 3 && intent) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setRole(null);
    setTime(null);
    setIntent(null);
  };

  const recommendedPack = getRecommendedPack();
  const intentLinks = getIntentLinks();

  return (
    <Page
      title="Start wizard"
      subtitle="Pick role + time + intent. Get a safe, inspection-friendly path."
    >
      {step === 1 && (
        <Card>
          <div className="h2 mb-4">Step 1: Who are you?</div>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              className={`card card-pad text-left hover:opacity-95 ${role === "leadership" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setRole("leadership");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Leadership</div>
              <div className="sub mt-1">School leaders, heads, governors</div>
            </button>
            <button
              className={`card card-pad text-left hover:opacity-95 ${role === "staff" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setRole("staff");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Staff</div>
              <div className="sub mt-1">Teachers, support staff</div>
            </button>
            <button
              className={`card card-pad text-left hover:opacity-95 ${role === "parents" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setRole("parents");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Parents</div>
              <div className="sub mt-1">Parents and carers</div>
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div className="h2 mb-4">Step 2: How much time right now?</div>
          <div className="flex flex-wrap gap-2">
            <button
              className={time === "5min" ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setTime("5min");
                setTimeout(handleNext, 300);
              }}
            >
              5 minutes
            </button>
            <button
              className={time === "20min" ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setTime("20min");
                setTimeout(handleNext, 300);
              }}
            >
              20 minutes
            </button>
            <button
              className={time === "60min" ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setTime("60min");
                setTimeout(handleNext, 300);
              }}
            >
              60 minutes
            </button>
          </div>
          <div className="mt-4">
            <button className="btn-ghost" onClick={handleBack}>
              ← Back
            </button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div className="h2 mb-4">Step 3: What do you need?</div>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              className={`card card-pad text-left hover:opacity-95 ${intent === "safety" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setIntent("safety");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Safety language</div>
              <div className="sub mt-1">Boundaries and safeguarding</div>
            </button>
            <button
              className={`card card-pad text-left hover:opacity-95 ${intent === "processes" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setIntent("processes");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Processes</div>
              <div className="sub mt-1">How to respond and repair</div>
            </button>
            <button
              className={`card card-pad text-left hover:opacity-95 ${intent === "modules" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setIntent("modules");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Modules</div>
              <div className="sub mt-1">Self-paced learning</div>
            </button>
            <button
              className={`card card-pad text-left hover:opacity-95 ${intent === "inspection" ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setIntent("inspection");
                setTimeout(handleNext, 300);
              }}
            >
              <div className="h2">Inspection framing</div>
              <div className="sub mt-1">How to describe the system</div>
            </button>
          </div>
          <div className="mt-4">
            <button className="btn-ghost" onClick={handleBack}>
              ← Back
            </button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <div className="h2 mb-2">Your Path</div>
          <div className="sub mb-4">Here&apos;s a curated path based on your answers:</div>

          {recommendedPack && (
            <div className="pt-4 border-t mb-4">
              <div className="flex gap-2 mb-2">
                <div className="pill">{recommendedPack.audience}</div>
                <div className="pill">{recommendedPack.duration}</div>
              </div>
              <div className="h2">{recommendedPack.title}</div>
              <div className="sub mt-1">{recommendedPack.description}</div>
              <div className="mt-4">
                <a className="btn-primary" href={`/packs/${recommendedPack.id}`}>
                  Open Pack →
                </a>
              </div>
            </div>
          )}

          {intentLinks.length > 0 && (
            <div className="pt-4 border-t mb-4">
              <div className="h2 mb-2">Recommended Links</div>
              <ul className="list-disc pl-5 space-y-1">
                {intentLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.href} className="text-primary hover:underline">{link.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <button className="btn-ghost" onClick={handleReset}>
              Start Over
            </button>
            <a className="btn-secondary" href="/packs">
              Browse All Packs
            </a>
          </div>
        </Card>
      )}
    </Page>
  );
}
