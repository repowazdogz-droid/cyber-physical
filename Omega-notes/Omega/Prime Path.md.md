
# **PRIME PATH 3.2**

  

**“Build Omega safely, reliably, cheaply-first, and learn fast”**

  

### **What this adds vs 3.0**

- **Ops Guardrails first** (so you can’t pollute memory, overspend, or drift)
    
- **Verification after every critical step**
    
- **Rollback / snapshot**
    
- **One front door** (one place you type)
    
- **Clarify-first** (anti-hallucination + anti-agreement)
    
- **Security baseline** (BitLocker + separate user + dependency integrity)
    

---

## **PHASE 0 — OPS GUARDRAILS (20–45 min)**

  

**Goal:** Make the system hard to break even if you’re tired.

  

### **0.1 Create the full structure (PowerShell Admin)**

```
mkdir C:\Prime -Force
mkdir C:\Prime\omega -Force
mkdir C:\Prime\omega\config -Force
mkdir C:\Prime\omega\data -Force
mkdir C:\Prime\omega\logs -Force
mkdir C:\Prime\omega\src -Force
mkdir C:\Prime\omega\backup -Force
mkdir C:\Prime\ai\models -Force
mkdir C:\Prime\research\inbox -Force
mkdir C:\Prime\research\processed -Force
mkdir C:\Prime\learning\modules -Force
mkdir C:\Prime\learning\queue -Force
mkdir C:\Prime\agents -Force
```

### **0.2 Write the “Memory Rules” file (prevents drift)**

  

Create: C:\Prime\omega\config\memory_rules.md

  

Put this in it (copy/paste):

- Default = **NO SAVE**
    
- Only save when explicitly tagged:
    
    - #SAVE (store)
        
    - #LEARN (turn into learning module)
        
    - #DECISION (store decision + reason)
        
    
- Anything not tagged = **scratch**
    
- Any stored output must pass **Verifier** check
    

  

### **0.3 Create spending + safety caps (prevents runaway)**

  

Create: C:\Prime\omega\config\limits.yaml

```
cost:
  max_daily_gbp: 10
  warn_at_gbp: 7
  require_confirm_if_est_cost_gbp_over: 1.5
  max_cloud_calls_per_hour: 30

models:
  default_strategy: cheapest_capable
  prefer_local: true

quality:
  require_verifier_for:
    - save
    - learn
    - publish
    - anything_for_kids
    - anything_health_or_safety_adjacent

behavior:
  clarify_if_uncertain: true
  never_auto_agree: true
```

### **0.4 Snapshot plan (so you can roll back)**

  

**Rule:** After Phase 2 and after Omega boots once, you create:

- Windows Restore Point (quick)
    
- Folder snapshot: copy C:\Prime\omega\ to C:\Prime\omega\backup\YYYY-MM-DD\
    

---

## **PHASE 1 — METAL HANDSHAKE (20–40 min)**

  

**Goal:** Stable drivers, no “CUDA hell”, no thermal surprises.

1. **Windows Update** fully (reboot until no updates remain)
    
2. **NVIDIA Studio Driver** install (clean install)
    
3. Optional but recommended: enable **Virtualization** in BIOS (for Docker/WSL later)
    

  

**Verification:**

- Task Manager → Performance → GPU shows your GPU correctly
    
- No random crashes
    

---

## **PHASE 2 — INSTALL FOUNDATION TOOLS (45–90 min)**

  

All copy-paste into PowerShell (Admin) unless marked manual.

  

### **2.1 Core installs (script)**

```
winget install -e --id Anaconda.Anaconda3
winget install -e --id Git.Git
winget install -e --id Microsoft.VisualStudioCode
winget install -e --id GitHub.GitHubDesktop
winget install -e --id LMStudio.LMStudio
winget install -e --id Ollama.Ollama
winget install -e --id Meta.QuestLink
winget install -e --id Zotero.Zotero
```

### **2.2 Creative tooling (script)**

```
winget install -e --id BlenderFoundation.Blender
winget install -e --id OBSProject.OBSStudio
winget install -e --id GIMP.GIMP
winget install -e --id Audacity.Audacity
```

### **2.3 Studios (manual, only because launchers)**

- **Unity Hub → Unity 2022 LTS** + Android Build Support (Quest), Windows Build Support, docs
    
- **Epic Launcher → Unreal 5.4** install path: C:\Prime\engines\unreal\
    
- **NVIDIA Omniverse Launcher** install path: C:\Prime\omniverse\
    
    Install: Create / USD Composer / Isaac Sim / Audio2Face / Machinima
    

  

**Verification (end of Phase 2):**

- VS Code opens
    
- git --version works
    
- LM Studio opens
    
- Ollama runs: ollama --version
    
- Quest Link installed
    

  

**Snapshot now:** restore point + copy C:\Prime\omega\ into backup\

---

## **PHASE 3 — OMEGA BOOTSTRAP (45–120 min)**

  

**Goal:** Omega runs from one command, with safety + cost + memory rules enforced.

  

### **3.1 Create conda env**

  

Open **new PowerShell**:

```
conda create -n omega python=3.11 -y
conda activate omega
pip install python-dotenv pyyaml rich requests
pip install openai anthropic google-generativeai
pip install qdrant-client sqlite-utils
```

### **3.2 Create the One Front Door command**

  

We’ll make a single entry script: C:\Prime\omega\src\omega.py

  

It will do:

- chat
    
- ingest
    
- build learning module
    
- call agent
    
- enforce #SAVE/#LEARN/#DECISION
    
- enforce verifier before writing memory
    
- enforce spend caps before cloud calls
    

  

(If you want it right now, tell me and I’ll paste the full file content next message.)

  

**Verification:**

```
conda activate omega
python C:\Prime\omega\src\omega.py --help
```

---

## **PHASE 4 — MODELS + ROUTING (60–180 min, mostly downloads)**

  

**Goal:** cheapest-first, local-first, cloud when needed.

  

### **4.1 Local models**

- LM Studio model folder: C:\Prime\ai\models
    
- Download **only 3 to start** (fast + stable):
    
    1. One general reasoning model (quantized)
        
    2. One coding model
        
    3. One vision model (optional)
        
    

  

(You can add the big ones later once everything works.)

  

### **4.2 Cloud APIs (only if/when you’re ready)**

- Add keys to: C:\Prime\omega\config\.env
    
- Spend caps already enforced by limits.yaml
    

  

**Verification:**

- Omega can do:
    
    - local response
        
    - cloud response
        
    - show estimated cost before expensive call
        
    

---

## **PHASE 5 — RESEARCH → LEARNING PIPELINE (60–120 min)**

  

**Goal:** Everything you ingest becomes learnable (text + visual + audio + spatial later).

  

### **5.1 “Inbox → Processed” flow**

- Drop PDFs/links into C:\Prime\research\inbox
    
- Run:
    

```
conda activate omega
python C:\Prime\omega\src\omega.py ingest C:\Prime\research\inbox
```

### **5.2 Learning module generator**

- Anything tagged #LEARN becomes:
    
    - 1-page summary
        
    - spaced repetition prompts
        
    - “teach-back” test
        
    - optional storyboard for XR version (later)
        
    

  

**Verification:**

- A new module appears in: C:\Prime\learning\modules
    

---

## **PHASE 6 — SAFETY / SECURITY BASELINE (45–120 min)**

  

**Goal:** “Fortress” without making your life annoying.

  

Do these:

1. **BitLocker** (full disk encryption)
    
2. **Dedicated Windows user for Omega** (non-admin daily use)
    
3. **.env never leaves machine**
    
4. **Dependency integrity**
    
    - freeze environment files after successful boot
        
    

  

**Verification:**

- You can run Omega without admin rights
    
- .env is ignored by git
    

---

## **PHASE 7 — AGENT SWARM + VERIFIER + RED TEAM (later same day or Day 2)**

  

**Goal:** You get autonomy _safely_ (build is automated; publish is manual).

  

Minimum set of agents to start:

- Builder
    
- Research Ingestor
    
- Learning Module Maker
    
- Verifier (fact/logic check)
    
- Safety Reviewer
    
- Cost Controller
    
- ND Designer
    
- Worldbuilder (XR)
    

  

**Rule:** Any output that is saved/published must pass:

1. Verifier
    
2. Safety Reviewer
    
3. (Optional) Grok/Claude critique pass
    

---

# **IGNITION TEST (the “proof it’s alive”)**

  

Run:

```
conda activate omega
python C:\Prime\omega\src\omega.py
```

Then do three commands:

1. chat → ask a question
    
2. ingest → ingest a PDF/link
    
3. learn → generate one module
    

  

If those work: **you’re live.**

---

# **The key change that makes you “not do it wrong”**

  

### **Memory writes ONLY happen on tags**

  

#SAVE / #LEARN / #DECISION

and all writes require Verifier.

  

That prevents:

- garbage training data
    
- accidental “belief locks”
    
- hallucinations becoming “truth” in your system
    

---

## **If you want the “Fully upgraded” version right now**

  

Tell me **which device you’re building first tonight**:

- **PC** or **Mac**
    
    …and I will paste the exact:
    
- omega.py (one front door)
    
- verifier.py
    
- ingest.py
    
- learn.py
    
- plus the minimal config files
    

  

So you can literally copy/paste and run.