# Omega Spatial — Room Generator

Creates a new Room folder with the same "safe by default" structure:
- Trust contract baked in
- Non-sim + non-autonomous framing
- Layers + toggles + selection + inspector stubs
- Locks + runbook templates
- Preset scaffolding (Inspector wording only)

## Usage

From repo root:

```bash
npm run room:new -- --name NewRoomName
```

Optional:

```bash
node omega-vision/tools/roomgen/roomgen.mjs --name NewRoomName --dest omega-vision
node omega-vision/tools/roomgen/roomgen.mjs --name NewRoomName --dry
```

## After generation (manual by design)

You still explicitly register the room in OmegaGallery:
- Add route enum case
- Add router case
- Add host view
- Add gallery card / registry entry
- Update NAVIGATION_LOCK.md

This is intentional: no automatic wiring, no hidden behavior.

































