import {
  Hero,
  Problem,
  ReasoningChain,
  TrustStack,
  DemosStrip,
  ProofsSection,
  ResearchSection,
  SdkSection,
  MarketingFooter,
} from "./components/marketing";

export default function HomePage() {
  return (
    <div
      style={{
        background: "var(--bg-deep)",
        color: "var(--text-primary)",
      }}
    >
      <Hero />
      <Problem />
      <ReasoningChain />
      <TrustStack />
      <DemosStrip />
      <ProofsSection />
      <ResearchSection />
      <SdkSection />
      <MarketingFooter />
    </div>
  );
}
