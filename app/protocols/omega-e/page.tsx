import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function OmegaEProtocolPage() {
  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        Omega-E (Epistemics)
      </h1>

      <Section title="What it inspects">
        <p>
          Omega-E inspects epistemic state extraction: what is known, unknown, uncertain, and why. It structures knowledge states and identifies the basis for epistemic claims.
        </p>
      </Section>

      <Section title="When to use">
        <p>
          Use Omega-E when you need to distinguish what's shown from what's implied, or to identify evidence boundaries. It's particularly useful for:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Evaluating research evidence or data
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Distinguishing observation from inference
          </li>
          <li style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            Identifying what can be directly verified
          </li>
        </ul>
      </Section>

      <Section title="Structure">
        <p style={{ marginBottom: '1rem' }}>
          Omega-E structures evidence inspection into:
        </p>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Directly shown:</strong> What can be observed, measured, or sourced directly
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Implied:</strong> What is inferred or concluded from what's shown
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Boundaries:</strong> Limits of what the evidence supports
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong>Gaps:</strong> What evidence is missing or unavailable
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
            Claim: "Study shows treatment X is 80% more effective"
          </p>
          <div style={{ fontSize: '0.9375rem' }}>
            <p><strong>Directly shown:</strong> Study results; sample size; methodology description.</p>
            <p><strong>Implied:</strong> Effectiveness is generalizable; results apply to all populations.</p>
            <p><strong>Boundaries:</strong> Results apply to study population; effectiveness measured under study conditions.</p>
            <p><strong>Gaps:</strong> Long-term outcomes; side effects; cost-effectiveness.</p>
          </div>
        </div>
      </Section>

      <Section title="Where it applies">
        <p>
          Omega-E applies wherever evidence needs structured inspection: research evaluation, data analysis, policy assessment, and technical review. It helps distinguish what's shown from what's inferred.
        </p>
      </Section>
    </ProtocolLayout>
  );
}

