import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function IndustriesPage() {
  const industries = [
    {
      name: 'Research & Academia',
      problem: 'Research claims often contain unstated assumptions, missing context, and unclear evidence boundaries. Structured inspection benefits evaluation of claims, assessment of evidence, and identification of gaps.',
      protocols: ['Omega', 'Omega-A (Alignment)', 'Omega-E (Epistemics)', 'Omega-U (Uncertainty)'],
    },
    {
      name: 'Policy & Governance',
      problem: 'Policy proposals and regulations involve complex tradeoffs, hidden assumptions, and uncertain outcomes. Structured inspection benefits examination of proposals without being overwhelmed by detail.',
      protocols: ['Omega', 'Omega-S (Stress)', 'Omega-C (Control)', 'Omega-U (Uncertainty)'],
    },
    {
      name: 'Technology & Engineering',
      problem: 'Technical architectures, system designs, and engineering decisions involve tradeoffs, constraints, and uncertainty. Structured inspection benefits examination of structure without losing nuance.',
      protocols: ['Omega-S (Stress)', 'Omega-C (Control)', 'Omega-E (Epistemics)', 'Omega-U (Uncertainty)'],
    },
    {
      name: 'Business & Strategy',
      problem: 'Business strategies, market analyses, and strategic decisions involve assumptions, tradeoffs, and uncertainty. Structured inspection benefits examination of options and identification of blind spots.',
      protocols: ['Omega', 'Omega-A (Alignment)', 'Omega-S (Stress)', 'Omega-C (Control)'],
    },
  ];

  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        Industries
      </h1>

      <Section>
        <p style={{ marginBottom: '2rem' }}>
          Omega protocols apply across industries where claims, systems, or decisions require structured inspection.
        </p>
      </Section>

      {industries.map((industry, idx) => (
        <Section key={idx} title={industry.name}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Problem</h3>
            <p style={{ color: '#525252' }}>{industry.problem}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Relevant protocols</h3>
            <p style={{ color: '#525252' }}>{industry.protocols.join(', ')}</p>
          </div>
        </Section>
      ))}
    </ProtocolLayout>
  );
}

