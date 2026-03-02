import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function OmegaAProtocolPage() {
  return (
    <ProtocolLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          margin: 0,
          color: '#171717',
        }}>
          Omega-A (Alignment)
        </h1>
        <a
          href="/pdfs/omega-a.pdf"
          download="omega-a.pdf"
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d4d4d4',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            color: '#171717',
            fontSize: '0.875rem',
            display: 'inline-block',
          }}
        >
          Download PDF →
        </a>
      </div>

      <Section title="What it inspects">
        <p>
          Omega-A inspects decision-boundary alignment: mandate, authority signals, decision substitution, value injection, and control preservation. It identifies where decisions are made, who has authority, and how boundaries are maintained.
        </p>
      </Section>

      <Section title="When to use">
        <p>
          Use Omega-A when you need to identify hidden assumptions or dependencies. It's particularly useful for:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Uncovering implicit premises in arguments or claims
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Identifying dependencies in system designs
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Examining prerequisites for decisions or strategies
          </li>
        </ul>
      </Section>

      <Section title="Structure">
        <p style={{ marginBottom: '1rem' }}>
          Omega-A structures assumption inspection into:
        </p>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Explicit assumptions:</strong> Premises that are stated but may be unexamined
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Implicit assumptions:</strong> Premises that are unstated but necessary
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Dependencies:</strong> Conditions that must hold for the assumption to be valid
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Uncertainty:</strong> Where assumptions are uncertain or unverifiable
          </li>
        </ol>
      </Section>

      <Section title="Micro-example">
        <div style={{
          backgroundColor: '#fafafa',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e5e5',
          marginBottom: '1rem',
        }}>
          <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
            Claim: "This regulation will reduce emissions by 50%"
          </p>
          <div style={{ fontSize: '0.9375rem' }}>
            <p><strong>Explicit assumptions:</strong> Regulation is enforceable; compliance is measurable.</p>
            <p><strong>Implicit assumptions:</strong> No substitution effects; baseline is accurate; economic impact is acceptable.</p>
            <p><strong>Dependencies:</strong> Regulatory capacity exists; measurement systems are in place.</p>
            <p><strong>Uncertainty:</strong> Whether 50% reduction is achievable; whether enforcement is sufficient.</p>
          </div>
        </div>
      </Section>

      <Section title="Where it applies">
        <p>
          Omega-A applies wherever assumptions need to be surfaced: policy analysis, system design, strategic planning, and research evaluation. It helps identify what must be true for claims or decisions to hold.
        </p>
      </Section>
    </ProtocolLayout>
  );
}

