# Demo Runbook

## 5-Minute Setup

### Prerequisites
- Next.js dev server running (`npm run dev`)
- Unity Editor or Vision Pro build
- Wi-Fi connection (optional - works offline)

### Quick Start

1. **Start Web Server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3000`

2. **Launch Unity / Vision Pro**
   - Open Unity project
   - Load SpatialWorkspace scene
   - Board auto-loads with demo data (offline-safe)

3. **Create Pairing (Optional)**
   - Visit `http://localhost:3000/pair`
   - Click "Create Pair QR (Demo)"
   - Scan QR in Vision Pro (or enter code)

4. **Start Showcase**
   - In Vision Pro: Tap "Start 60s" or "Start 90s"
   - Showcase runs automatically

5. **View Audience Mirror (Optional)**
   - Open `http://localhost:3000/audience/{sessionId}` on projector
   - Mirrors XR board state live

6. **Teacher Remote (Optional)**
   - Open `http://localhost:3000/teacher/remote`
   - Enter learnerId + sessionId
   - Spotlight thoughts (opt-in only)

## 60-Second Fallback Path

### If Wi-Fi Fails
- **XR**: Uses offline cache (last loaded board)
- **Showcase**: Still works (uses cached objects)
- **Export**: Saves to local files (no web upload)

### If Web Server Fails
- **XR**: Fully functional standalone
- **Showcase**: Runs end-to-end
- **Export**: Local file export only
- **Audience Mirror**: Not available (requires server)

### If Vision Pro Crashes
- **Recovery**: Restart Unity / Vision Pro
- **State**: Lost (but export persists if completed)
- **Showcase**: Can restart from beginning

## Offline Cache Behavior

- **Thought Objects**: Cached in `persistentDataPath/thoughtObjects_cache.json`
- **Bootstrap**: Cached in PlayerPrefs
- **Showcase**: Uses cached objects if HTTP unreachable
- **Export**: Always works (local file system)

## Known Limitations

- **Presence**: Requires web server (HTTP pusher)
- **Remote Commands**: Requires web server + opt-in
- **Audience Mirror**: Requires web server + active session
- **LAN UDP**: Disabled by default (use HTTP instead)

## Troubleshooting

### Showcase doesn't start
- Check: Showcase enabled in board settings
- Check: ShowcaseReel asset assigned
- Check: Showtime mode not conflicting

### Audience mirror not updating
- Check: Web server running
- Check: SessionId matches
- Check: PresenceHttpPusher enabled in Unity
- Check: Network connectivity

### Remote commands not working
- Check: Access granted (adult opt-in / minor default)
- Check: SessionId matches
- Check: RemoteCommandClient enabled in Unity
- Check: Learner hasn't dismissed (cooldown active)

### Export fails
- Check: File system permissions
- Check: Disk space
- Check: Export path writable

## Demo Checklist

Before demo:
- [ ] Web server running
- [ ] Unity / Vision Pro launched
- [ ] Pairing created (if using)
- [ ] Showcase reel loaded
- [ ] Reduce motion ON (default)
- [ ] Offline cache populated (optional)

During demo:
- [ ] Start showcase (60s or 90s)
- [ ] Audience mirror visible (if using)
- [ ] Teacher remote ready (if using)
- [ ] Export completes successfully

After demo:
- [ ] Recap link shown
- [ ] Export bundle saved
- [ ] All systems stable








































