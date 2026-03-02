import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function OmegaUProtocolPage() {
  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        Omega-U (Uncertainty)
      </h1>

      <Section title="What it inspects">
        <p>
          Omega-U inspects uncertainty visibility: bounds, sensitivity, fragility, and confidence qualifiers. It structures uncertainty and identifies where confidence is warranted vs unwarranted.
        </p>
      </Section>

      <Section title="When to use">
        <p>
          Use Omega-U when you need to identify and structure uncertainty. It's particularly useful for:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Identifying unknowns in claims or decisions
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Structuring ambiguity or unclear information
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Examining what cannot be determined
          </li>
        </ul>
      </Section>

      <Section title="Structure">
        <p style={{ marginBottom: '1rem' }}>
          Omega-U structures uncertainty inspection into:
        </p>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Known unknowns:</strong> What is recognized as uncertain or unknown
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Unknown unknowns:</strong> What is not recognized as uncertain
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Ambiguity:</strong> Where information is unclear or can be interpreted multiple ways
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Unknowable:</strong> What cannot be determined from available information
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
            Claim: "This strategy will double revenue in 18 months"
          </p>
          <div style={{ fontSize: '0.9375rem' }}>
            <p><strong>Known unknowns:</strong> Market conditions; competitive response; execution capability.</p>
            <p><strong>Unknown unknowns:</strong> Unforeseen market shifts; regulatory changes; technology disruptions.</p>
            <p><strong>Ambiguity:</strong> What "double" means (gross vs net); what "revenue" includes.</p>
            <p><strong>Unknowable:</strong> Future market conditions; long-term competitive dynamics.</p>
          </div>
        </div>
      </Section>

      <Section title="Where it applies">
        <p>
          Omega-U applies wherever uncertainty needs structured inspection: strategic planning, risk assessment, research evaluation, and decision support. It helps identify and organize what's unknown or unclear.
        </p>
      </Section>
    </ProtocolLayout>
  );
}

