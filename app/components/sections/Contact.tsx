'use client';

import { useState, FormEvent } from 'react';
import { LANDING_COPY } from "@/app/content/landing";

export default function Contact() {
  const { contact } = LANDING_COPY;
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Safe default: mailto link
    const email = contact.email.replace('[contact email]', 'contact@omega.example');
    const subject = encodeURIComponent('Contact from OMEGA site');
    const body = encodeURIComponent(message || 'What kind of work are you doing?');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    setSubmitted(true);
  };
  
  return (
    <section id="contact" className="section">
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{contact.title}</h2>
          <p className="p-muted">{contact.intro}</p>
          <p className="p-muted">Email: {contact.email}</p>
          <p className="p-muted" style={{ whiteSpace: 'pre-line' }}>{contact.prompt}</p>
          <p className="note" style={{ marginTop: 'var(--s-2)' }}>If you want early access to Omega-RC, include that in your message.</p>
          <form onSubmit={handleSubmit} style={{ marginTop: 'var(--s-5)' }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What kind of work are you doing?"
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--s-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-1)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-md)',
                lineHeight: 'var(--lh-normal)',
                resize: 'vertical'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--s-3)' }}>Send</button>
          </form>
          {submitted && (
            <p className="note">Message sent.</p>
          )}
          <p className="note" style={{ whiteSpace: 'pre-line' }}>{contact.note}</p>
        </div>
      </div>
    </section>
  );
}

