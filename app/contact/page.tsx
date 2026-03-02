import ProtocolLayout from '../protocol-site/components/ProtocolLayout';
import { Section } from '../protocol-site/components/Section';

export default function ContactPage() {
  return (
    <ProtocolLayout>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        color: '#171717',
      }}>
        Contact
      </h1>

      <Section>
        <p style={{ marginBottom: '1.5rem' }}>
          Omega Protocol is open infrastructure.<br />
          Most use does not require contact or permission.
        </p>
        <p style={{ marginBottom: '2rem' }}>
          For questions, context, or potential collaboration, you can reach us below.
        </p>

        <hr style={{
          border: 0,
          borderTop: '1px solid #e5e5e5',
          margin: '2rem 0',
        }} />

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: '#171717',
        }}>
          Send a message
        </h2>

        <form
          action="https://formspree.io/f/mlgrapzl"
          method="POST"
          style={{
            maxWidth: '480px',
            marginTop: '2rem',
          }}
        >
          <label
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontWeight: 500,
              color: '#171717',
            }}
          >
            Your email
            <input
              type="email"
              id="email"
              name="email"
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                marginTop: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
              }}
            />
          </label>

          <label
            htmlFor="message"
            style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontWeight: 500,
              color: '#171717',
            }}
          >
            Message
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              style={{
                width: '100%',
                padding: '0.6rem',
                marginTop: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </label>

          {/* Optional context */}
          <input type="hidden" name="source" value="Omega Protocol website" />

          <button
            type="submit"
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.4rem',
              backgroundColor: '#171717',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>

        <hr style={{
          border: 0,
          borderTop: '1px solid #e5e5e5',
          margin: '2rem 0',
        }} />

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: '#171717',
        }}>
          What to use this for
        </h2>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          marginBottom: '2rem',
        }}>
          <li style={{
            marginBottom: '0.75rem',
            paddingLeft: '1.5rem',
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            questions about Omega protocols
          </li>
          <li style={{
            marginBottom: '0.75rem',
            paddingLeft: '1.5rem',
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            discussion of applications or contexts
          </li>
          <li style={{
            marginBottom: '0.75rem',
            paddingLeft: '1.5rem',
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            stewardship or governance topics
          </li>
          <li style={{
            marginBottom: '0.75rem',
            paddingLeft: '1.5rem',
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: 0 }}>•</span>
            invitations to collaborate or explore fit
          </li>
        </ul>
        <p style={{ marginBottom: '2rem', fontStyle: 'italic', color: '#666' }}>
          You do not need to pitch, justify, or formalize an inquiry.
        </p>

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: '#171717',
        }}>
          Technical matters
        </h2>
        <p>
          For Omega RC (the web tool), implementation issues, or bugs, please refer to the documentation or submit an issue report where applicable.
        </p>
      </Section>

      <Section>
        <p style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e5e5e5',
          color: '#666',
          fontSize: '0.9rem',
        }}>
          Omega Protocol — Infrastructure for reasoning under uncertainty
        </p>
      </Section>
    </ProtocolLayout>
  );
}



