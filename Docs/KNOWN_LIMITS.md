# Known Limits

## Demo-Grade vs Production-Grade

### Demo-Grade (Current)
- **Storage**: In-memory + local files (`/tmp/`)
- **Persistence**: No database, manual cleanup
- **Scaling**: Single server, no load balancing
- **Security**: Basic access gates, no authentication
- **Reliability**: Graceful degradation, offline fallback

### Production-Grade (Future)
- **Storage**: Database (PostgreSQL, MongoDB, etc.)
- **Persistence**: Automated cleanup, archival
- **Scaling**: Multi-server, load balancing, CDN
- **Security**: Full authentication, encryption, audit logs
- **Reliability**: Redundancy, monitoring, alerting

## Current Limitations

### Storage
- **Sessions**: Max 200 per learner (FIFO eviction)
- **Turns**: Max 50 per session
- **Observations**: Max 200 per session
- **Assessments**: Max 10 per session
- **Thought Objects**: Max 60 per board (FIFO eviction)

### Network
- **Presence**: HTTP polling (1s interval), not WebSocket
- **Remote Commands**: HTTP polling (1s interval), not real-time
- **Thought Objects**: HTTP polling (1s interval), not push
- **Rate Limits**: Client-side only, no server-side throttling

### Performance
- **Showcase**: Deterministic, but not optimized for large boards
- **Replay**: Linear playback, no seek/jump
- **Export**: Synchronous, blocks during export
- **Presence**: No batching, sends individual updates

### Features
- **QR Scanning**: Editor fallback only (camera not implemented)
- **Video Export**: Not implemented (JSON only)
- **Multi-User**: Presence-lite only (no true collaboration)
- **Analytics**: None (by design)

### Reliability
- **Offline**: Cache-based, may be stale
- **Errors**: Graceful degradation, but no retry logic
- **Timeouts**: Client-side only, no server-side timeouts
- **Recovery**: Manual restart required for crashes

## Hard Limits

### Deterministic Constraints
- **Showcase**: Must use board public APIs only
- **Replay**: Must be deterministic (no randomness)
- **State**: Bounded arrays (no infinite growth)
- **Hashing**: Non-cryptographic (FNV-1a)

### Safety Constraints
- **No Autonomy**: All actions require explicit input
- **No Grading**: No scores, ranks, labels
- **No Text Sync**: IDs-only for presence/remote
- **No Spine Changes**: `/spine/expressions/**` frozen

## Workarounds

### For Demos
- Use offline cache if network fails
- Use local file export if web server fails
- Use manual code entry if QR scan fails
- Use default showcase reel if custom fails

### For Production
- Implement database persistence
- Add WebSocket for real-time updates
- Add authentication/authorization
- Add monitoring/alerting
- Add retry logic/timeouts
- Add video export
- Add true multi-user support

## Future Enhancements

### Short-Term (Next Release)
- WebSocket for presence/remote
- Server-side rate limiting
- Automated cleanup jobs
- Better error recovery

### Medium-Term
- Database persistence
- Authentication system
- Video export
- True collaboration

### Long-Term
- Multi-tenant support
- Analytics (opt-in, privacy-preserving)
- Mobile apps
- API for third-party integrations








































