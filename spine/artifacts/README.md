# Artifact Vault

Durable storage for bundles, runs, and other artifacts. Bounded, deterministic, versioned.

## Overview

The Artifact Vault provides a unified interface for storing and retrieving artifacts across the system:
- Learning bundles (session + board + thought objects)
- Kernel run records
- Orchestrator run records
- Teacher access records
- XR pairing records
- Recap artifacts

## Key Features

### Bounded Storage
- **Payload size limit**: Default 512KB per artifact (configurable)
- **List results**: Max 50 artifacts per list operation
- **In-memory vault**: Max 200 total artifacts (FIFO eviction)

### Deterministic Hashing
- **Canonical JSON**: Keys sorted recursively for stable hashing
- **SHA-256**: Content hash for integrity verification
- **No time-based logic**: Hashes are deterministic regardless of when computed

### Atomic Writes
- **File system vault**: Writes to `.tmp` file first, then atomic rename
- **No partial writes**: Either complete artifact or none

## Usage

### Basic Operations

```typescript
import { FsArtifactVault } from './FsArtifactVault';
import { ArtifactKind } from './ArtifactTypes';

const vault = new FsArtifactVault();

// Store an artifact
const meta = await vault.put(
  ArtifactKind.bundle,
  'session-123',
  { sessionlog: {...}, learningBoard: {...} }
);

// Retrieve an artifact
const record = await vault.get(ArtifactKind.bundle, 'session-123');
if (record) {
  console.log(record.meta.contentHash);
  console.log(record.payload);
}

// List artifacts
const bundles = await vault.list(ArtifactKind.bundle, {
  createdAfter: '2024-01-01T00:00:00Z'
});

// Delete an artifact
await vault.delete(ArtifactKind.bundle, 'session-123');
```

### Metadata

Each artifact includes metadata:
- `id`: Unique artifact ID
- `kind`: Artifact kind
- `createdAtIso`: Creation timestamp
- `contractVersion`: Contract version (for compatibility)
- `contentHash`: SHA-256 hash of payload (deterministic)
- `sizeBytes`: Payload size in bytes
- `tags`: Optional tags (max 10)
- `ttlSeconds`: Optional time-to-live

## Implementation Details

### File System Vault
- **Location**: `/tmp/artifactVault/{kind}/{id}.json`
- **Format**: JSON with inline metadata
- **Atomic writes**: `.tmp` file then rename

### In-Memory Vault
- **Use case**: Tests and development
- **Eviction**: FIFO when max artifacts reached
- **No persistence**: Cleared on process exit

## Bounds & Rules

1. **Payload size**: Max 512KB (configurable via constructor)
2. **List results**: Max 50 artifacts
3. **In-memory total**: Max 200 artifacts (FIFO eviction)
4. **Tags**: Max 10 per artifact
5. **Deterministic hashing**: Same payload → same hash (regardless of key order)

## Contract Versioning

All artifacts include `contractVersion` matching `CONTRACT_VERSION` from `/spine/contracts/ContractVersion.ts`. This enables:
- Version compatibility checks
- Migration paths
- Schema validation

## Future Extensions

- **TTL support**: Automatic expiration based on `ttlSeconds`
- **Compression**: Optional payload compression for large artifacts
- **Encryption**: Optional payload encryption for sensitive artifacts
- **Backend storage**: S3, database, etc. (via interface implementation)








































