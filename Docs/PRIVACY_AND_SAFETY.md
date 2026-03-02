# Privacy and Safety

## Presence / Remote: IDs-Only Policy

**Critical**: Presence and remote command systems transmit **IDs only, no text content**.

### What is Transmitted
- Thought object IDs (e.g., `thought_123`)
- Session IDs
- Cluster IDs (e.g., `Questions`, `Examples`)
- State flags (focused, pinned, spotlight)
- Timestamps

### What is NOT Transmitted
- Thought content text
- Learner utterances
- Tutor messages
- Any personal information
- Any learning content

### Implementation
- `PresenceStateDto`: Contains only IDs
- `RemoteCommandDto`: Contains only IDs
- Server-side validation: Rejects payloads with text content
- Client-side: Never sends text in presence/remote payloads

## Adult Opt-In Rules

### Default Behavior
- **Minors (6-18)**: Teacher/parent access allowed by default
- **Adults**: Teacher access requires explicit opt-in

### Opt-In Flow
1. Teacher requests access via `/api/learning/teacherAccess`
2. Adult learner receives request
3. Learner approves via `/app/learning/permissions`
4. Access granted, stored in `/tmp/teacherAccess/{learnerId}.json`
5. Teacher can now use remote commands

### Revocation
- Learner can revoke access anytime
- Revocation takes effect immediately
- Remote commands rejected after revocation

## Spotlight Dismissal Guarantee

### Learner Control
- **Always**: Learner can dismiss spotlight locally
- **Immediate**: Dismissal takes effect instantly
- **Cooldown**: 10-second cooldown prevents repeated show commands for dismissed thought
- **Override**: Teacher can change thoughtId to bypass cooldown

### Implementation
- `RemoteCommandClient.OnLocalDismiss()`: Tracks dismissal
- Cooldown window: 10 seconds
- Local dismissal always wins during cooldown
- Teacher can change thoughtId to spotlight different thought

## Data Storage

### Ephemeral Storage
- **Presence state**: `/tmp/presence/{sessionId}.json` (TTL 5 minutes)
- **Remote commands**: `/tmp/remote/{sessionId}.json` (TTL 2 minutes)
- **Pairing codes**: `/tmp/pairing/{pairCode}.json` (TTL 10 minutes)

### Persistent Storage
- **Learning bundles**: `/tmp/learningBundles/{sessionId}/` (manual cleanup)
- **Teacher access**: `/tmp/teacherAccess/{learnerId}.json` (until revoked)

### No Long-Term Tracking
- No analytics
- No user profiles
- No learning history aggregation
- No cross-session tracking

## Safety Boundaries

### No Autonomy
- All actions require explicit user input
- No automatic spotlight
- No automatic sharing
- No background data collection

### No Grading
- No scores
- No ranks
- No labels
- No diagnosis
- No judgment

### No Coercion
- Learner can stop anytime
- Learner can dismiss spotlight
- Learner can revoke access
- No pressure, no urgency

## Compliance

### COPPA (Children's Privacy)
- Minors: Parent/teacher access by default (supervised)
- No data collection without consent
- No third-party sharing

### FERPA (Educational Records)
- No permanent records
- No grade storage
- No academic judgment
- Process-focused, not outcome-focused

### GDPR (EU Privacy)
- Minimal data collection
- Ephemeral storage
- User control (opt-in, revocation)
- No cross-border data transfer (local-only by default)








































