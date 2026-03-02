/**
 * Contact API
 * 
 * Handles contact form submissions with honeypot, rate limiting, and artifact storage.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { putArtifact } from '@spine/artifacts/ArtifactVault';
import { ArtifactKind } from '@spine/artifacts/ArtifactTypes';
import { normalizeContactInquiry } from '@spine/artifacts/kinds/ContactInquiry';

// Email configuration
const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? 'warrensmith8@ymail.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? 'Omega Protocol <no-reply@omegaprotocol.org>';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

// In-memory rate limit store (best-effort)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Gets client IP from request.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

/**
 * Checks rate limit for an IP.
 */
function checkRateLimit(ip: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    // Reset or create entry
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Cleans up old rate limit entries (best-effort, runs on each request).
 */
function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Sends email notification for contact form submission.
 * Uses SMTP if configured via env vars, otherwise logs (for development).
 */
async function sendEmailNotification(inquiry: {
  name?: string;
  email?: string;
  org?: string;
  message: string;
  domainTags?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    // If SMTP is not configured, optionally log (non-production) and return success
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Contact] Email notification (SMTP not configured):', {
          to: TO_EMAIL,
          from: FROM_EMAIL,
          replyTo: inquiry.email || FROM_EMAIL,
          subject: 'Contact Form Submission - Omega Protocol',
          inquiry: {
            name: inquiry.name,
            email: inquiry.email,
            org: inquiry.org,
            message: inquiry.message.substring(0, 100) + '...',
          },
        });
      }
      return { ok: true };
    }

    // Try to use nodemailer if available, otherwise fall back to logging
    // Use dynamic import with string to prevent webpack from trying to resolve it
    let nodemailer: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodemailer = require('nodemailer');
    } catch {
      // nodemailer not installed - optionally log email details (non-production)
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Contact] Email (nodemailer not installed):', {
          to: TO_EMAIL,
          from: FROM_EMAIL,
          replyTo: inquiry.email || FROM_EMAIL,
          subject: 'Contact Form Submission - Omega Protocol',
          body: [
            `Name: ${inquiry.name || '(not provided)'}`,
            `Email: ${inquiry.email || '(not provided)'}`,
            `Organization: ${inquiry.org || '(not provided)'}`,
            inquiry.domainTags && inquiry.domainTags.length > 0
              ? `Tags: ${inquiry.domainTags.join(', ')}`
              : '',
            '',
            `Message:`,
            inquiry.message,
          ]
            .filter(Boolean)
            .join('\n'),
        });
      }
      return { ok: true };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Build email body
    const emailBody = [
      `Name: ${inquiry.name || '(not provided)'}`,
      `Email: ${inquiry.email || '(not provided)'}`,
      `Organization: ${inquiry.org || '(not provided)'}`,
      inquiry.domainTags && inquiry.domainTags.length > 0
        ? `Tags: ${inquiry.domainTags.join(', ')}`
        : '',
      '',
      `Message:`,
      inquiry.message,
    ]
      .filter(Boolean)
      .join('\n');

    // Send email
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: inquiry.email || FROM_EMAIL,
      subject: 'Contact Form Submission - Omega Protocol',
      text: emailBody,
    });

    return { ok: true };
  } catch (error: any) {
    console.error('[Contact] Email send error:', error);
    return { ok: false, error: error?.message || 'Email send failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    cleanupRateLimit();

    // Check rate limit
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot check
    if (body.hp && body.hp.trim().length > 0) {
      return NextResponse.json(
        { ok: false, message: 'Invalid request.' },
        { status: 400 }
      );
    }

    // Consent check
    if (body.consentToStore !== true) {
      return NextResponse.json(
        { ok: false, message: 'Consent required.' },
        { status: 400 }
      );
    }

    // Normalize payload
    const normalization = normalizeContactInquiry(body);
    if (!normalization.ok || !normalization.normalized) {
      return NextResponse.json(
        { ok: false, message: normalization.errors.join('; ') || 'Validation failed.' },
        { status: 400 }
      );
    }

    // Store as artifact (ensure contractVersion is in payload.meta)
    const artifactId = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const result = await putArtifact(
      ArtifactKind.CONTACT_INQUIRY,
      { 
        meta: { contractVersion: '1.0.0' },
        inquiry: normalization.normalized 
      },
      { artifactId }
    );

    // Send email notification (non-blocking, log errors but don't fail request)
    sendEmailNotification(normalization.normalized).catch((err) => {
      console.error('[Contact] Email notification failed (non-blocking):', err);
    });

    return NextResponse.json({
      ok: true,
      artifactId: result.artifactId
    });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to process request.' },
      { status: 500 }
    );
  }
}



