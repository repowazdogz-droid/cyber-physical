export type ClaimStatus =
  | 'verified'
  | 'unverified'
  | 'contradicted'
  | 'phantom';

export interface VerificationResult {
  claim_id: string;
  status: ClaimStatus;
  evidence?: string;
  confidence: number;
  source?: string;
}
