import ProtocolLayout from '../../protocol-site/components/ProtocolLayout';
import { Section } from '../../protocol-site/components/Section';

export default function ExamplesPage() {
  const examples = [
    {
      title: 'Research Claim',
      claim: 'AI systems trained on large datasets will achieve human-level performance in most cognitive tasks within 5 years.',
      analysis: {
        claims: 'Predicts AI performance reaching human levels in most cognitive tasks within a 5-year timeframe.',
        assumes: ['Large datasets are sufficient for human-level performance', 'Current training methods will scale', 'Cognitive tasks are measurable and comparable'],
        shown: ['No specific evidence provided', 'No definition of "human-level performance"', 'No specification of which cognitive tasks'],
        missing: ['What datasets are required', 'What training methods', 'How performance is measured', 'What "most" means'],
        framings: ['Could be interpreted as net positive (capability) or net negative (displacement)', 'Assumes linear progress rather than plateaus or setbacks'],
      },
    },
    {
      title: 'Policy Statement',
      claim: 'This new regulation will reduce emissions by 50% while maintaining economic growth.',
      analysis: {
        claims: 'Regulation will achieve 50% emission reduction without negative economic impact.',
        assumes: ['Regulation is enforceable', 'Economic growth metrics remain unchanged', 'No substitution effects'],
        shown: ['No specific regulation details', 'No baseline for "50%"', 'No definition of "economic growth"'],
        missing: ['What the regulation requires', 'How compliance is verified', 'What happens to non-compliant actors', 'Timeframe for reduction'],
        framings: ['Could prioritize environmental goals over economic ones', 'Could assume economic growth definition excludes externalities'],
      },
    },
    {
      title: 'Product Promise',
      claim: 'Our new platform will increase productivity by 3x with zero learning curve.',
      analysis: {
        claims: 'Platform delivers 3x productivity improvement with no user training required.',
        assumes: ['Productivity is measurable and comparable', 'Zero learning curve is achievable', 'Current productivity baseline is known'],
        shown: ['No definition of productivity', 'No specification of tasks or users', 'No evidence of zero learning curve'],
        missing: ['What productivity means', 'What tasks are included', 'Who the users are', 'How improvement is measured'],
        framings: ['Could prioritize ease-of-use over capability', 'Could assume productivity gains are universal'],
      },
    },
    {
      title: 'Technical Architecture',
      claim: 'This distributed system design will handle 10x traffic with 50% lower latency.',
      analysis: {
        claims: 'System architecture supports 10x traffic increase with 50% latency reduction.',
        assumes: ['Traffic patterns remain similar', 'Latency is measurable and comparable', 'No bottlenecks emerge at scale'],
        shown: ['No specific architecture details', 'No baseline traffic or latency', 'No load testing results'],
        missing: ['What the architecture is', 'How traffic is distributed', 'What causes latency', 'How latency is measured'],
        framings: ['Could prioritize scale over consistency', 'Could assume latency improvements are uniform'],
      },
    },
    {
      title: 'Business Strategy',
      claim: 'Expanding into this new market will double revenue within 18 months.',
      analysis: {
        claims: 'Market expansion will achieve 2x revenue growth in 18-month timeframe.',
        assumes: ['New market is accessible', 'Current revenue model applies', 'No competitive response'],
        shown: ['No market analysis', 'No revenue model details', 'No competitive assessment'],
        missing: ['What the market is', 'How expansion happens', 'What revenue model', 'What costs are involved'],
        framings: ['Could prioritize growth over profitability', 'Could assume market conditions remain favorable'],
      },
    },
    {
      title: 'Scientific Finding',
      claim: 'This study demonstrates that treatment X is 80% more effective than standard care.',
      analysis: {
        claims: 'Treatment X shows 80% effectiveness improvement over standard care.',
        assumes: ['Effectiveness is measurable and comparable', 'Study design is valid', 'Results are generalizable'],
        shown: ['No study methodology', 'No sample size or demographics', 'No definition of effectiveness'],
        missing: ['What the study design was', 'Who the participants were', 'How effectiveness was measured', 'What standard care means'],
        framings: ['Could prioritize statistical significance over clinical significance', 'Could assume results apply to all populations'],
      },
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
        Examples
      </h1>

      <Section>
        <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
          Each example shows how Omega protocols expose structure — not whether the claim is true or false.
        </p>
        <p style={{ marginBottom: '2rem' }}>
          These examples show how Omega protocols expose structure in different types of claims. Each example identifies what's claimed, what's assumed, what's shown, what's missing, and alternative framings.
        </p>
      </Section>

      {examples.map((example, idx) => (
        <Section key={idx} title={example.title}>
          <div style={{
            backgroundColor: '#fafafa',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e5e5',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '1.125rem',
              fontWeight: 500,
              marginBottom: '1rem',
              fontStyle: 'italic',
              color: '#404040',
            }}>
              "{example.claim}"
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>What it claims</h3>
            <p style={{ color: '#525252' }}>{example.analysis.claims}</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>What it assumes</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {example.analysis.assumes.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>What's actually shown</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {example.analysis.shown.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>What's missing / unclear</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {example.analysis.missing.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Other framings</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {example.analysis.framings.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ))}
    </ProtocolLayout>
  );
}

