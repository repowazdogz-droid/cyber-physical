# omega-cli (Omega Spatial sanity CLI)

## Run
go run . doctor

## Commands
- doctor: runs all checks (packs, locks, trust, version)
- packs: validates pack JSON coverage (required IDs)
- locks: validates required LOCKED files exist
- trust: validates canonical trust copy exists
- version: validates VERSIONING + FREEZE_MANIFEST exist

Exit code:
- 0: all good
- 2: warnings found (non-fatal unless doctor --strict)
- 1: failures

## Notes
This CLI does NOT:
- build Xcode projects
- run simulators
- modify code
It only reads files.

































