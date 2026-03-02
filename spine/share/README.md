# Share Token Store

Unified share token system for consent and sharing flows. ND-first, bounded, deterministic.

## Overview

The Share Token Store provides a single primitive for:
- Teacher access requests
- Session recap sharing
- Kernel/orchestrator run visibility
- XR pairing handoff

## Key Features

### Bounded Storage
- **Max tokens per learner**: 50 (FIFO eviction)
- **Max TTL**: 24 hours
- **Token length**: Fixed 32 characters

### Scoped Access
- **TEACHER_RECAP**: Teacher access to learner recap
- **SESSION_RECAP**: Share session recap link
- **KERNEL_RUNS**: View kernel runs
- **ORCHESTRATOR_RUNS**: View orchestrator runs
- **PAIRING_BOOTSTRAP**: XR pairing handoff

### Deterministic & Bounded
- **Atomic writes**: `.tmp` file then rename
- **FIFO eviction**: Oldest tokens removed when limit reached
- **TTL enforcement**: Tokens expire automatically

## Usage

### Create Token

```typescript
import { getShareTokenStore } from './ShareTokenStore';
import { ShareScope } from './ShareTypes';

const store = getShareTokenStore();
const token = await store.createToken(
  ShareScope.TEACHER_RECAP,
  'learner-123',
  'session-456',
  60 // TTL in minutes
);
```

### Validate Token

```typescript
const result = await store.validateToken(token.token, ShareScope.TEACHER_RECAP);
if (result.ok && result.allowed) {
  // Access granted
  console.log(result.learnerId, result.sessionId);
}
```

### Revoke Token

```typescript
const revoked = await store.revokeToken(token.token);
```

### List Tokens

```typescript
const tokens = await store.listTokens('learner-123');
```

## Integration with GateEngine

Share tokens work with GateEngine (FOUNDATION-06):
1. **Token creation**: GateEngine checks if action is allowed
2. **Token validation**: GateEngine constraints applied to access
3. **Adult opt-in**: Token serves as opt-in proof for adults

## Bounds & Rules

1. **Max tokens**: 50 per learner (FIFO eviction)
2. **Max TTL**: 24 hours
3. **Token length**: 32 characters (hex)
4. **Atomic writes**: No partial writes
5. **Deterministic**: Same inputs → same token ID (but token itself is random)

## Future Extensions

- **Index-based lookup**: For production, use database index instead of file scan
- **Token rotation**: Automatic token refresh
- **Audit log**: Track token usage
- **Rate limiting**: Prevent token spam








































