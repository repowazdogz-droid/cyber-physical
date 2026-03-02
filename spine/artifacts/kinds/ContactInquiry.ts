/**
 * Contact Inquiry Artifact
 * 
 * Bounded, normalized contact inquiry payload.
 * 
 * Version: 1.0.0
 */

export type PreferredFollowup = 'email' | 'call' | 'none';

export interface ContactInquiryPayload {
  name?: string;
  email?: string;
  org?: string;
  domainTags?: string[];
  message: string;
  preferredFollowup?: PreferredFollowup;
  consentToStore: boolean;
  createdAtIso: string;
}

export interface NormalizationResult {
  ok: boolean;
  errors: string[];
  normalized?: ContactInquiryPayload;
}

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;
const MAX_ORG_LENGTH = 120;
const MAX_DOMAIN_TAG_LENGTH = 30;
const MAX_DOMAIN_TAGS = 8;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_ERRORS = 10;

/**
 * Normalizes a contact inquiry payload.
 */
export function normalizeContactInquiry(payload: any): NormalizationResult {
  const errors: string[] = [];
  const normalized: ContactInquiryPayload = {
    message: '',
    consentToStore: false,
    createdAtIso: new Date().toISOString()
  };

  // Name (optional, max 80)
  if (payload.name !== undefined && payload.name !== null) {
    if (typeof payload.name !== 'string') {
      errors.push('name must be a string');
    } else {
      const trimmed = payload.name.trim();
      if (trimmed.length > MAX_NAME_LENGTH) {
        normalized.name = trimmed.substring(0, MAX_NAME_LENGTH);
        errors.push(`name truncated to ${MAX_NAME_LENGTH} characters`);
      } else {
        normalized.name = trimmed;
      }
    }
  }

  // Email (optional, max 120)
  if (payload.email !== undefined && payload.email !== null) {
    if (typeof payload.email !== 'string') {
      errors.push('email must be a string');
    } else {
      const trimmed = payload.email.trim();
      if (trimmed.length > MAX_EMAIL_LENGTH) {
        normalized.email = trimmed.substring(0, MAX_EMAIL_LENGTH);
        errors.push(`email truncated to ${MAX_EMAIL_LENGTH} characters`);
      } else {
        normalized.email = trimmed;
      }
    }
  }

  // Org (optional, max 120)
  if (payload.org !== undefined && payload.org !== null) {
    if (typeof payload.org !== 'string') {
      errors.push('org must be a string');
    } else {
      const trimmed = payload.org.trim();
      if (trimmed.length > MAX_ORG_LENGTH) {
        normalized.org = trimmed.substring(0, MAX_ORG_LENGTH);
        errors.push(`org truncated to ${MAX_ORG_LENGTH} characters`);
      } else {
        normalized.org = trimmed;
      }
    }
  }

  // Domain tags (optional, max 8 tags, each max 30)
  if (payload.domainTags !== undefined && payload.domainTags !== null) {
    if (!Array.isArray(payload.domainTags)) {
      errors.push('domainTags must be an array');
    } else {
      const tags = payload.domainTags
        .slice(0, MAX_DOMAIN_TAGS)
        .filter((tag: any) => typeof tag === 'string')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
        .map((tag: string) => tag.length > MAX_DOMAIN_TAG_LENGTH ? tag.substring(0, MAX_DOMAIN_TAG_LENGTH) : tag);
      
      if (payload.domainTags.length > MAX_DOMAIN_TAGS) {
        errors.push(`domainTags limited to ${MAX_DOMAIN_TAGS} tags`);
      }
      
      normalized.domainTags = tags;
    }
  }

  // Message (required, max 1200)
  if (payload.message === undefined || payload.message === null) {
    errors.push('message is required');
  } else if (typeof payload.message !== 'string') {
    errors.push('message must be a string');
  } else {
    const trimmed = payload.message.trim();
    if (trimmed.length === 0) {
      errors.push('message cannot be empty');
    } else if (trimmed.length > MAX_MESSAGE_LENGTH) {
      normalized.message = trimmed.substring(0, MAX_MESSAGE_LENGTH);
      errors.push(`message truncated to ${MAX_MESSAGE_LENGTH} characters`);
    } else {
      normalized.message = trimmed;
    }
  }

  // Preferred followup (optional enum)
  if (payload.preferredFollowup !== undefined && payload.preferredFollowup !== null) {
    if (typeof payload.preferredFollowup !== 'string') {
      errors.push('preferredFollowup must be a string');
    } else {
      const followup = payload.preferredFollowup.trim().toLowerCase();
      if (followup === 'email' || followup === 'call' || followup === 'none') {
        normalized.preferredFollowup = followup as PreferredFollowup;
      } else {
        errors.push('preferredFollowup must be one of: email, call, none');
      }
    }
  }

  // Consent (required boolean)
  if (payload.consentToStore === undefined || payload.consentToStore === null) {
    errors.push('consentToStore is required');
  } else if (typeof payload.consentToStore !== 'boolean') {
    errors.push('consentToStore must be a boolean');
  } else {
    normalized.consentToStore = payload.consentToStore;
  }

  // CreatedAtIso (optional, defaults to now)
  if (payload.createdAtIso !== undefined && payload.createdAtIso !== null) {
    if (typeof payload.createdAtIso !== 'string') {
      errors.push('createdAtIso must be a string');
    } else {
      normalized.createdAtIso = payload.createdAtIso;
    }
  }

  // Bound errors
  const boundedErrors = errors.slice(0, MAX_ERRORS);

  return {
    ok: boundedErrors.length === 0,
    errors: boundedErrors,
    normalized: normalized // Always return normalized object, even if there are errors
  };
}



