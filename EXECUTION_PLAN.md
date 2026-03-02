# OMEGA Personal Compute Node — Execution Plan

**Mapped to 24-Hour Build Plan (Section 22)**

---

## PHASE 1: Foundation (Hours 0-1)

### 1.1 System Preparation
- [ ] Install Xcode Command Line Tools (`xcode-select --install`)
- [ ] Install Homebrew (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)
- [ ] Configure Homebrew shell environment (`eval "$(/opt/homebrew/bin/brew shellenv)"` → `~/.zprofile`)

### 1.2 Core Tools Installation
- [ ] Install: `git`, `jq`, `curl`, `wget`, `htop`, `ffmpeg`
- [ ] Verify installations

### 1.3 Tailscale Setup
- [ ] Download Tailscale from https://tailscale.com/download/mac
- [ ] Sign in to Tailscale account
- [ ] Enable MagicDNS at admin.tailscale.com
- [ ] Set hostname to `omega`
- [ ] Enable tailscale ssh
- [ ] Verify: `tailscale status`

### 1.4 OrbStack Installation
- [ ] Install OrbStack (`brew install orbstack`)
- [ ] Verify: `docker --version && docker compose version`

### 1.5 Ollama Setup
- [ ] Install Ollama (`brew install ollama`)
- [ ] Pull models:
  - [ ] `ollama pull nomic-embed-text`
  - [ ] `ollama pull llama3.2:14b`
  - [ ] `ollama pull llama3.2:3b`
- [ ] Verify: `ollama list`

### 1.6 Whisper.cpp Setup
- [ ] Clone repository (`git clone https://github.com/ggerganov/whisper.cpp.git ~/whisper.cpp`)
- [ ] Build (`cd ~/whisper.cpp && make -j16`)
- [ ] Download medium model (`bash ./models/download-ggml-model.sh medium`)
- [ ] Verify: `~/whisper.cpp/main --help`

### 1.7 Data Directory Structure
- [ ] Create `~/omega-data/` root directory
- [ ] Create subdirectories:
  - [ ] `pg/` (Postgres data)
  - [ ] `archives/` (Processed documents)
  - [ ] `audio/` (Audio awaiting transcription)
  - [ ] `transcripts/` (Completed transcriptions)
  - [ ] `ingest/` (Drop zone)
  - [ ] `backups/` (Postgres dumps)
  - [ ] `logs/` (App logs)
  - [ ] `scripts/` (Automation scripts)
  - [ ] `services/api/` (API build context)
  - [ ] `services/whisper/` (Whisper build context)
  - [ ] `services/ingest/` (Ingest build context)
  - [ ] `services/jobs/` (Jobs build context)
  - [ ] `services/health/` (Health build context)

### 1.8 Environment File Creation
- [ ] Generate `.env` file at `~/omega-data/.env` with:
  - [ ] `POSTGRES_USER=omega`
  - [ ] `POSTGRES_PASSWORD` (random 16-byte hex)
  - [ ] `POSTGRES_DB=omega`
  - [ ] `API_SECRET` (random 16-byte hex)
  - [ ] `ANTHROPIC_API_KEY=sk-ant-REPLACE_ME`
- [ ] Set permissions: `chmod 600 ~/omega-data/.env`

---

## PHASE 2: Database (Hours 1-3)

### 2.1 Docker Compose Configuration
- [ ] Create `~/omega-data/docker-compose.yml` with all 6 services:
  - [ ] Postgres (pgvector/pgvector:pg16)
  - [ ] API service (build context)
  - [ ] Whisper service (build context)
  - [ ] Ingest service (build context)
  - [ ] Jobs service (build context)
  - [ ] Health service (build context)
- [ ] Configure all services:
  - [ ] Port bindings to 127.0.0.1 only
  - [ ] Restart policy: `unless-stopped`
  - [ ] Volume mounts to `~/omega-data/`
  - [ ] Environment variables from `.env`
  - [ ] Health checks (Postgres)
  - [ ] Dependencies (API, Ingest, Jobs, Health depend on Postgres)
  - [ ] Memory limits per service

### 2.2 Postgres Schema Deployment
- [ ] Create schema SQL file with:
  - [ ] Extensions: `vector`, `uuid-ossp`, `pg_trgm`
  - [ ] Tables: `decisions`, `assumptions`, `decision_links`, `reasoning_logs`, `documents`, `transcriptions`, `job_log`
  - [ ] Vector indexes (IVFFlat) on all embedding columns
  - [ ] Standard indexes (status, type, foreign keys)
  - [ ] Full-text search indexes (GIN)
- [ ] Start Postgres container: `cd ~/omega-data && docker compose up -d postgres`
- [ ] Wait for health check to pass
- [ ] Execute schema SQL: `docker exec -i omega-postgres psql -U omega omega < schema.sql`
- [ ] Verify: `docker exec omega-postgres psql -U omega omega -c "\dt"`

### 2.3 Vector Operations Verification
- [ ] Test vector extension: `docker exec omega-postgres psql -U omega omega -c "SELECT vector('[1,2,3]');"`
- [ ] Test embedding column: `docker exec omega-postgres psql -U omega omega -c "SELECT embedding FROM decisions LIMIT 1;"` (should return empty)
- [ ] Test cosine similarity: `docker exec omega-postgres psql -U omega omega -c "SELECT '[1,2,3]'::vector <=> '[1,2,3]'::vector;"`

---

## PHASE 3: Services (Hours 3-6)

### 3.1 API Service Build
- [ ] Create `~/omega-data/services/api/Dockerfile`
- [ ] Create `~/omega-data/services/api/` application code:
  - [ ] Health endpoint (`GET /health`)
  - [ ] Decision CRUD (`POST /decisions`, `GET /decisions/:id`, `PUT /decisions/:id`)
  - [ ] Assumption CRUD (`POST /assumptions`, `GET /assumptions`)
  - [ ] Reasoning log creation (`POST /reasoning-logs`)
  - [ ] Semantic search (`POST /search` with embedding)
  - [ ] Database connection (Postgres via DATABASE_URL)
  - [ ] Ollama integration (via OLLAMA_URL)
- [ ] Add API service to docker-compose.yml
- [ ] Build and start: `docker compose build api && docker compose up -d api`
- [ ] Test: `curl http://localhost:3100/health`

### 3.2 Health Monitor Service Build
- [ ] Create `~/omega-data/services/health/Dockerfile`
- [ ] Create `~/omega-data/services/health/` application code:
  - [ ] Health endpoint (`GET /health`) returning JSON:
    - [ ] Service statuses (Postgres, Ollama, API)
    - [ ] Disk usage
    - [ ] Archive counts (decisions, assumptions, reasoning_logs, documents, transcriptions)
    - [ ] Last backup timestamp
    - [ ] Last embedding run timestamp
- [ ] Add health service to docker-compose.yml
- [ ] Build and start: `docker compose build health && docker compose up -d health`
- [ ] Test: `curl http://localhost:3400/health | jq .`

### 3.3 Whisper Service Build
- [ ] Create `~/omega-data/services/whisper/Dockerfile`
- [ ] Create `~/omega-data/services/whisper/` application code:
  - [ ] HTTP endpoint (`POST /transcribe`) accepting audio file
  - [ ] Integration with Whisper.cpp binary
  - [ ] Write transcript to `~/omega-data/transcripts/`
  - [ ] Return transcript JSON
- [ ] Add Whisper service to docker-compose.yml
- [ ] Build and start: `docker compose build whisper && docker compose up -d whisper`
- [ ] Test: `curl -X POST http://localhost:3200/transcribe -F "file=@test.wav"`

### 3.4 Ingest Service Build
- [ ] Create `~/omega-data/services/ingest/Dockerfile`
- [ ] Create `~/omega-data/services/ingest/` application code:
  - [ ] Watch `~/omega-data/ingest/` directory
  - [ ] Process files (text extraction, metadata)
  - [ ] Generate embeddings via Ollama
  - [ ] Insert into `documents` table
  - [ ] Move processed files to `~/omega-data/archives/`
- [ ] Add ingest service to docker-compose.yml
- [ ] Build and start: `docker compose build ingest && docker compose up -d ingest`
- [ ] Test: Drop test file in `~/omega-data/ingest/`, verify DB entry

### 3.5 Jobs Service Build
- [ ] Create `~/omega-data/services/jobs/Dockerfile`
- [ ] Create `~/omega-data/services/jobs/` application code:
  - [ ] Background job runner
  - [ ] Database connection
  - [ ] Ollama integration
  - [ ] Job logging to `job_log` table
- [ ] Add jobs service to docker-compose.yml
- [ ] Build and start: `docker compose build jobs && docker compose up -d jobs`
- [ ] Verify: `docker logs omega-jobs`

### 3.6 Full Stack Startup
- [ ] Start all services: `cd ~/omega-data && docker compose --env-file .env up -d`
- [ ] Verify all containers running: `docker compose ps`
- [ ] Check logs for errors: `docker compose logs`

---

## PHASE 4: Automation (Hours 6-8)

### 4.1 Script 1: Generate Embeddings (`generate-embeddings.sh`)
- [ ] Create `~/omega-data/scripts/generate-embeddings.sh`
- [ ] Implement logic:
  - [ ] Query each table (decisions, assumptions, reasoning_logs, documents, transcriptions) for NULL embeddings
  - [ ] Extract text content per table schema
  - [ ] Call Ollama API (`http://localhost:11434/api/embeddings`) with nomic-embed-text
  - [ ] Update record with embedding vector
  - [ ] Log to `~/omega-data/logs/embeddings-YYYYMMDD.log`
- [ ] Make executable: `chmod +x ~/omega-data/scripts/generate-embeddings.sh`
- [ ] Test manually: Run script, verify embeddings populated

### 4.2 Script 2: Cluster Assumptions (`cluster-assumptions.sh`)
- [ ] Create `~/omega-data/scripts/cluster-assumptions.sh`
- [ ] Implement logic:
  - [ ] Query assumptions with embeddings
  - [ ] Find pairs with cosine similarity > 0.85 across different decisions
  - [ ] Insert findings as reasoning_log entries (log_type='insight', source='auto:cluster')
  - [ ] Log to `~/omega-data/logs/clustering-YYYYMMDD.log`
- [ ] Make executable: `chmod +x ~/omega-data/scripts/cluster-assumptions.sh`
- [ ] Test manually: Run script, verify reasoning_log entries

### 4.3 Script 3: Transcribe Audio (`transcribe.sh`)
- [ ] Create `~/omega-data/scripts/transcribe.sh`
- [ ] Implement logic:
  - [ ] Scan `~/omega-data/audio/` for `.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`
  - [ ] Skip if transcript already exists
  - [ ] Convert to 16kHz mono WAV via ffmpeg
  - [ ] Run Whisper.cpp (`~/whisper.cpp/main -m ~/whisper.cpp/models/ggml-medium.bin`)
  - [ ] Extract transcript, duration
  - [ ] Insert into `transcriptions` table
  - [ ] Log to `~/omega-data/logs/transcription-YYYYMMDD.log`
- [ ] Make executable: `chmod +x ~/omega-data/scripts/transcribe.sh`
- [ ] Test manually: Drop test audio file, run script, verify transcript + DB entry

### 4.4 Script 4: Detect Themes (`detect-themes.sh`)
- [ ] Create `~/omega-data/scripts/detect-themes.sh`
- [ ] Implement logic:
  - [ ] Query recent reasoning_logs (last 30 days, limit 50)
  - [ ] Aggregate content
  - [ ] Call Ollama API (`llama3.2:3b`) with theme detection prompt
  - [ ] Insert result as reasoning_log entry (log_type='insight', source='auto:themes')
  - [ ] Log to `~/omega-data/logs/themes-YYYYMMDD.log`
- [ ] Make executable: `chmod +x ~/omega-data/scripts/detect-themes.sh`
- [ ] Test manually: Run script, verify reasoning_log entry

### 4.5 Script 5: Database Backup (`backup.sh`)
- [ ] Create `~/omega-data/scripts/backup.sh`
- [ ] Implement logic:
  - [ ] Run `pg_dump` via docker exec
  - [ ] Compress with gzip
  - [ ] Save to `~/omega-data/backups/omega-YYYYMMDD-HHMMSS.sql.gz`
  - [ ] Delete backups older than 30 days
  - [ ] Verify backup integrity (`gunzip -t`)
  - [ ] macOS notification on failure
  - [ ] Log to `~/omega-data/logs/backup-YYYYMMDD.log`
- [ ] Make executable: `chmod +x ~/omega-data/scripts/backup.sh`
- [ ] Test manually: Run script, verify backup file created and valid

### 4.6 Script 6: Health Check (`health-check.sh`)
- [ ] Create `~/omega-data/scripts/health-check.sh`
- [ ] Implement logic:
  - [ ] Check Postgres (`docker exec omega-postgres pg_isready`)
  - [ ] Check Ollama (`curl http://localhost:11434/api/tags`)
  - [ ] Check API (`curl http://localhost:3100/health`)
  - [ ] Check disk usage (`df -h /`)
  - [ ] macOS notification on any failure
  - [ ] Log alerts to `~/omega-data/logs/health.log`
- [ ] Make executable: `chmod +x ~/omega-data/scripts/health-check.sh`
- [ ] Test manually: Run script, verify health checks pass

### 4.7 Launch Agent Configuration

#### 4.7.1 Embeddings Agent (`com.omega.embeddings.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.embeddings.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.embeddings`
  - [ ] Program: `/bin/bash` + script path
  - [ ] StartCalendarInterval: Hour=2, Minute=0 (daily 02:00)
  - [ ] StandardOutPath: `~/omega-data/logs/embeddings-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/embeddings-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.embeddings.plist`

#### 4.7.2 Clustering Agent (`com.omega.clustering.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.clustering.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.clustering`
  - [ ] Program: `/bin/bash` + script path
  - [ ] StartCalendarInterval: Hour=3, Minute=0, Weekday=0 (Sunday 03:00)
  - [ ] StandardOutPath: `~/omega-data/logs/clustering-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/clustering-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.clustering.plist`

#### 4.7.3 Transcription Agent (`com.omega.transcription.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.transcription.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.transcription`
  - [ ] Program: `/bin/bash` + script path
  - [ ] StartInterval: 900 (every 15 minutes)
  - [ ] StandardOutPath: `~/omega-data/logs/transcription-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/transcription-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.transcription.plist`

#### 4.7.4 Theme Detection Agent (`com.omega.themes.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.themes.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.themes`
  - [ ] Program: `/bin/bash` + script path
  - [ ] StartCalendarInterval: Hour=4, Minute=0, Weekday=6 (Saturday 04:00)
  - [ ] StandardOutPath: `~/omega-data/logs/themes-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/themes-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.themes.plist`

#### 4.7.5 Backup Agent (`com.omega.backup.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.backup.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.backup`
  - [ ] Program: `/bin/bash` + script path
  - [ ] StartCalendarInterval: Hour=1, Minute=0 (daily 01:00)
  - [ ] StandardOutPath: `~/omega-data/logs/backup-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/backup-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.backup.plist`

#### 4.7.6 Health Check Agent (`com.omega.health.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.health.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.health`
  - [ ] Program: `/bin/bash` + script path
  - [ ] StartInterval: 300 (every 5 minutes)
  - [ ] StandardOutPath: `~/omega-data/logs/health-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/health-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.health.plist`

#### 4.7.7 Ollama Launch Agent (`com.omega.ollama.plist`)
- [ ] Create `~/Library/LaunchAgents/com.omega.ollama.plist`
- [ ] Configure:
  - [ ] Label: `com.omega.ollama`
  - [ ] Program: `/opt/homebrew/bin/ollama serve`
  - [ ] RunAtLoad: `true`
  - [ ] KeepAlive: `true`
  - [ ] StandardOutPath: `~/omega-data/logs/ollama-stdout.log`
  - [ ] StandardErrorPath: `~/omega-data/logs/ollama-stderr.log`
- [ ] Load: `launchctl load ~/Library/LaunchAgents/com.omega.ollama.plist`

### 4.8 Verify All Agents
- [ ] List all Omega agents: `launchctl list | grep omega`
- [ ] Verify all 7 agents loaded (6 scripts + Ollama)
- [ ] Check agent statuses

---

## PHASE 5: Security & System Configuration (Hours 10-12)

### 5.1 Firewall Configuration
- [ ] Enable firewall: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on`
- [ ] Enable stealth mode: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on`
- [ ] Block all incoming by default: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall on`
- [ ] Verify: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`

### 5.2 FileVault Encryption
- [ ] Verify FileVault status: `fdesetup status`
- [ ] If disabled, enable FileVault (requires user interaction)
- [ ] Save recovery key to password manager
- [ ] Verify: `fdesetup status` shows "FileVault is On"

### 5.3 Power & Sleep Configuration
- [ ] Disable sleep: `sudo pmset -a sleep 0`
- [ ] Disable disk sleep: `sudo pmset -a disksleep 0`
- [ ] Disable display sleep: `sudo pmset -a displaysleep 0`
- [ ] Enable auto-restart after power loss: `sudo pmset -a autorestart 1`
- [ ] Disable Power Nap: `sudo pmset -a powernap 0`
- [ ] Verify: `pmset -g`

### 5.4 SSH Disabled (Use Tailscale SSH)
- [ ] Verify SSH disabled: `sudo systemsetup -getremotelogin` (should show "Off")
- [ ] If enabled, disable: `sudo systemsetup -setremotelogin off`
- [ ] Verify Tailscale SSH works: `tailscale ssh omega` (from remote device)

### 5.5 Credentials Backup
- [ ] Export `.env` file securely
- [ ] Store recovery keys in password manager
- [ ] Document Tailscale admin access

---

## PHASE 6: Testing (Hours 12-14)

### 6.1 Acceptance Test 1: Reboot Survival
- [ ] Restart Mac Mini
- [ ] Wait 3 minutes after boot
- [ ] Verify containers: `docker compose ps` (all running)
- [ ] Verify Ollama: `curl http://localhost:11434/api/tags`
- [ ] Verify health endpoint: `curl http://localhost:3400/health | jq .`
- [ ] Verify Tailscale: `tailscale status` (connected)

### 6.2 Acceptance Test 2: Container Recovery
- [ ] Kill Postgres container: `docker kill omega-postgres`
- [ ] Wait 30 seconds
- [ ] Verify container restarted: `docker ps | grep omega-postgres`
- [ ] Verify Postgres healthy: `docker exec omega-postgres pg_isready -U omega`

### 6.3 Acceptance Test 3: Remote Access
- [ ] From phone on mobile hotspot:
  - [ ] Load: `http://omega:3400/health` (should return JSON)
  - [ ] SSH: `tailscale ssh omega` (should connect)
- [ ] Verify both work

### 6.4 Acceptance Test 4: Backup/Restore
- [ ] Insert test data into database
- [ ] Run backup script: `~/omega-data/scripts/backup.sh`
- [ ] Verify backup file created: `ls -lh ~/omega-data/backups/`
- [ ] Drop test table or clear data
- [ ] Restore from backup: `gunzip -c ~/omega-data/backups/omega-*.sql.gz | docker exec -i omega-postgres psql -U omega omega`
- [ ] Verify data restored

### 6.5 Acceptance Test 5: Embeddings
- [ ] Insert test decision (no embedding)
- [ ] Run embedding script: `~/omega-data/scripts/generate-embeddings.sh`
- [ ] Verify embedding populated: `docker exec omega-postgres psql -U omega omega -c "SELECT embedding IS NOT NULL FROM decisions WHERE id='<test-id>';"`

### 6.6 Acceptance Test 6: Transcription
- [ ] Place test audio file in `~/omega-data/audio/`
- [ ] Run transcription script: `~/omega-data/scripts/transcribe.sh`
- [ ] Verify transcript file created: `ls ~/omega-data/transcripts/`
- [ ] Verify DB entry: `docker exec omega-postgres psql -U omega omega -c "SELECT * FROM transcriptions WHERE audio_file='<filename>';"`

### 6.7 Acceptance Test 7: Semantic Search
- [ ] Insert 3+ decisions with embeddings
- [ ] Query via API: `curl -X POST http://localhost:3100/search -H "Content-Type: application/json" -d '{"query":"<test query>","limit":10}'`
- [ ] Verify ranked results returned

### 6.8 Acceptance Test 8: Automations
- [ ] Verify all agents loaded: `launchctl list | grep omega` (should show 7)
- [ ] Check health log: `tail ~/omega-data/logs/health.log` (should have recent entries)
- [ ] Manually trigger one script, verify execution

### 6.9 Acceptance Test 9: Power Loss Recovery
- [ ] Unplug Mac Mini power
- [ ] Replug power
- [ ] Verify auto-boot (no button press required)
- [ ] Wait 3 minutes
- [ ] Verify services up: `curl http://localhost:3400/health | jq .`

### 6.10 Acceptance Test 10: Encryption
- [ ] Verify FileVault: `fdesetup status` (should show "On")
- [ ] Verify recovery key stored in password manager
- [ ] Document recovery process

---

## PHASE 7: Seed Data (Hours 14-16)

### 7.1 Enter Real OMEGA Decisions
- [ ] Insert 3-5 real decisions via API or direct SQL:
  - [ ] Title, description, context
  - [ ] Decision type, status
  - [ ] Confidence, stakes
- [ ] Insert associated assumptions:
  - [ ] Link to decisions
  - [ ] Statement, type, confidence
- [ ] Insert decision links:
  - [ ] Relationships (depends_on, contradicts, informs, etc.)

### 7.2 Generate Embeddings
- [ ] Run embedding script: `~/omega-data/scripts/generate-embeddings.sh`
- [ ] Verify all decisions, assumptions have embeddings
- [ ] Check logs for errors

### 7.3 Test Semantic Search
- [ ] Query via API with test search terms
- [ ] Verify relevant decisions returned
- [ ] Verify similarity scores reasonable

### 7.4 Test Decision Links
- [ ] Query decision dependency chain via SQL
- [ ] Verify recursive CTE works
- [ ] Test via API if endpoint exists

---

## PHASE 8: Documentation & Handoff (Hours 16+)

### 8.1 Operational Documentation
- [ ] Document Tailscale access: `tailscale ssh omega`
- [ ] Document health endpoint: `http://omega:3400/health`
- [ ] Document API endpoint: `http://omega:3100/`
- [ ] Document backup location: `~/omega-data/backups/`
- [ ] Document log location: `~/omega-data/logs/`

### 8.2 Monitoring Setup
- [ ] Bookmark health endpoint on phone
- [ ] Set up periodic health check reminders (optional)
- [ ] Document alert mechanism (macOS notifications)

### 8.3 Maintenance Schedule
- [ ] Document monthly update process (Section 18)
- [ ] Document backup verification process
- [ ] Document recovery procedures (Section 17)

### 8.4 Final Verification
- [ ] All services running: `docker compose ps`
- [ ] All agents loaded: `launchctl list | grep omega`
- [ ] Health endpoint healthy: `curl http://localhost:3400/health | jq .`
- [ ] Remote access works: `tailscale ssh omega`
- [ ] Test data searchable via semantic search

---

## Build Complete ✅

**Node operational. Begin daily use.**

---

## Notes

- **Total estimated time:** 16-24 hours
- **Critical path:** Foundation → Database → Services → Automation → Testing
- **Blocking dependencies:** Postgres must be healthy before API/Ingest/Jobs/Health services start
- **Rollback points:** After each phase, verify before proceeding
- **Failure recovery:** Each phase can be re-run independently if needed
