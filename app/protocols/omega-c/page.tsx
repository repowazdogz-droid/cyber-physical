import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function OmegaCProtocolPage() {
  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        Omega-C (Control)
      </h1>

      <Section title="What it inspects">
        <p>
          Omega-C inspects control and authority boundaries: override, escalation, autonomy ceilings, and operator agency. It identifies where control resides and how boundaries are enforced.
        </p>
      </Section>

      <Section title="When to use">
        <p>
          Use Omega-C when you need to identify constraints or boundaries. It's particularly useful for:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Identifying limits in claims or proposals
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Examining boundaries in system designs
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Understanding requirements or conditions
          </li>
        </ul>
      </Section>

      <Section title="Structure">
        <p style={{ marginBottom: '1rem' }}>
          Omega-C structures constraint inspection into:
        </p>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Hard constraints:</strong> Limits that cannot be violated
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Soft constraints:</strong> Limits that can be relaxed or negotiated
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Boundaries:</strong> Edges or limits of scope or applicability
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Requirements:</strong> Conditions that must be met
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
            Claim: "This system will handle 10x traffic"
          </p>
          <div style={{ fontSize: '0.9375rem' }}>
            <p><strong>Hard constraints:</strong> Physical infrastructure limits; network bandwidth; storage capacity.</p>
            <p><strong>Soft constraints:</strong> Cost targets; performance targets; user experience requirements.</p>
            <p><strong>Boundaries:</strong> Applies to specific traffic patterns; within defined timeframes; under normal conditions.</p>
            <p><strong>Requirements:</strong> Infrastructure scaling; load balancing; monitoring systems.</p>
          </div>
        </div>
      </Section>

      <Section title="Where it applies">
        <p>
          Omega-C applies wherever constraints need structured inspection: system design, policy analysis, technical architecture, and strategic planning. It helps identify limits, boundaries, and requirements.
        </p>
      </Section>
    </ProtocolLayout>
  );
}

