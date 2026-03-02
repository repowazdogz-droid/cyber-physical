import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function OmegaSProtocolPage() {
  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        Omega-S (Stress)
      </h1>

      <Section title="What it inspects">
        <p>
          Omega-S inspects stress testing, scenario completeness, reverse stress, and BAU integration. It examines how systems, claims, or decisions perform under stress and identifies scenario gaps.
        </p>
      </Section>

      <Section title="When to use">
        <p>
          Use Omega-S when you need to examine system structure, architecture, or design. It's particularly useful for:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Analyzing technical architectures or system designs
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Examining organizational structures or processes
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Reviewing policy systems or governance structures
          </li>
        </ul>
      </Section>

      <Section title="Structure">
        <p style={{ marginBottom: '1rem' }}>
          Omega-S structures system inspection into:
        </p>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Components:</strong> Elements that make up the system
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Relationships:</strong> How components interact or depend on each other
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Constraints:</strong> Limits or requirements that bound the system
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Tradeoffs:</strong> Choices between competing objectives or constraints
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
            System: "Distributed database architecture"
          </p>
          <div style={{ fontSize: '0.9375rem' }}>
            <p><strong>Components:</strong> Database nodes; replication layer; consensus mechanism; client interface.</p>
            <p><strong>Relationships:</strong> Nodes replicate data; consensus ensures consistency; clients read/write through interface.</p>
            <p><strong>Constraints:</strong> Network latency; storage capacity; consistency requirements.</p>
            <p><strong>Tradeoffs:</strong> Consistency vs availability; latency vs durability; scale vs complexity.</p>
          </div>
        </div>
      </Section>

      <Section title="Where it applies">
        <p>
          Omega-S applies wherever systems need structured inspection: technical architecture, organizational design, policy systems, and process analysis. It helps identify components, relationships, constraints, and tradeoffs.
        </p>
      </Section>
    </ProtocolLayout>
  );
}

