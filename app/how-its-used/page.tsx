import ProtocolLayout from '../protocol-site/components/ProtocolLayout';
import { Section } from '../protocol-site/components/Section';
import Link from 'next/link';

export default function HowItsUsedPage() {
  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        How It's Used
      </h1>

      <Section>
        <p style={{ marginBottom: '1.5rem' }}>
          Omega protocols are applied across research, policy analysis, technical review, and decision support. They help teams surface assumptions, identify evidence boundaries, explore alternatives, and communicate structure without prescribing outcomes.
        </p>
        <p>
          Use cases range from evaluating research claims to reviewing system designs and analyzing policy proposals. The protocols are domain-agnostic and adaptable to context.
        </p>
      </Section>

      <Section title="Examples">
        <p style={{ marginBottom: '1rem' }}>
          See concrete examples of Omega protocols applied to real claims, systems, and decisions:
        </p>
        <Link 
          href="/how-its-used/examples"
          style={{
            display: 'inline-block',
            color: '#171717',
            textDecoration: 'underline',
            fontSize: '1rem',
          }}
        >
          View examples →
        </Link>
      </Section>

      <Section title="Industries">
        <p style={{ marginBottom: '1rem' }}>
          Learn how Omega protocols apply to specific industries and problem domains:
        </p>
        <Link 
          href="/how-its-used/industries"
          style={{
            display: 'inline-block',
            color: '#171717',
            textDecoration: 'underline',
            fontSize: '1rem',
          }}
        >
          View industries →
        </Link>
      </Section>
    </ProtocolLayout>
  );
}

