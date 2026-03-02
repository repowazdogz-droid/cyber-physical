# Repository Structure: Pressure Lab & Orientation Lab

## Overview

Two separate React + TypeScript + Vite applications in the Omega workspace:

- **Pressure Lab** (`ed-flow-lab/`) - Decision inspection for demand–capacity systems
- **Orientation Lab** (`orientation-lab/`) - World orientation under uncertainty

---

## 📁 Pressure Lab (`ed-flow-lab/`)

**Purpose:** Decision inspection tool for demand–capacity systems. Makes constraints legible, not a dashboard or prediction tool.

### Root Files
```
ed-flow-lab/
├── package.json              # React 19.2.0, Vite 7.2.4, TypeScript 5.9.3
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── tsconfig.app.json        # App-specific TS config
├── tsconfig.node.json       # Node-specific TS config
├── eslint.config.js         # ESLint configuration
├── index.html               # Entry HTML
├── README.md                # Default Vite template README
└── PRESSURE_LAB_CONTENT.md  # UI text, prompts, example outputs
```

### Source Structure (`src/`)

```
src/
├── main.tsx                 # React entry point
├── App.tsx                  # Main application component
├── App.css                  # App-specific styles
├── index.css                # Global styles
│
├── components/              # React components
│   ├── AdvancedJson.tsx           # Advanced JSON editor accordion
│   ├── CockpitPanel.tsx           # Comparative pressure summary
│   ├── CompareBar.tsx             # A/B comparison bar
│   ├── ConstraintsForm.tsx       # Form-based constraints editor
│   ├── NarrativeBlock.tsx        # Narrative display with boundary hardening
│   ├── PauseAndPredict.tsx       # Human prediction checkpoint
│   ├── PressureArtifactPack.tsx  # Artifact pack display
│   ├── PressureSketches.tsx      # Starter sketch selector
│   ├── RunDetail.tsx             # Run detail memo view
│   └── RunLibrary.tsx            # Saved runs library
│
├── data/                    # Static data
│   └── pressureSketches.ts        # Starter pressure sketches (ED & GENERIC)
│
├── types/                   # TypeScript type definitions
│   ├── compare.ts                 # Compare state types
│   ├── constraints.ts             # Constraint schemas (ED/GENERIC)
│   ├── prediction.ts              # Prediction bundle types
│   ├── pressureArtifact.ts        # Artifact pack structure
│   ├── pressureArtifactEdits.ts   # Human edit overlay types
│   └── run.ts                     # Saved run structure
│
└── utils/                   # Utility functions
    ├── artifactEdits.ts           # Apply/seed artifact edits
    ├── constraintsCodec.ts        # JSON parsing/coercion
    ├── formatters.ts              # Value formatting utilities
    ├── mergePatch.ts              # Deep merge utility
    ├── pressureArtifact.ts        # Build artifact packs
    ├── pressureDiff.ts            # Compare constraint objects
    ├── pressureNarrative.ts      # Mode-specific narrative formatting
    ├── pressurePrompts.ts         # Room discussion prompts
    ├── pressureSummary.ts         # Summarize from inputs
    ├── runSummary.ts              # Build scan-friendly summaries
    └── runs.ts                    # Create/manage saved runs
```

### Legacy Files (`_legacy/`)
```
_legacy/
├── useEdSimulation.legacy.ts
└── WaitChart.legacy.tsx
```

### Key Features

1. **Mode Split:** ED (Emergency Department) vs GENERIC (delivery/program) modes with distinct constraint schemas
2. **Pressure Sketches:** Starter templates to reduce blank-slate paralysis
3. **Pause & Predict:** Human-first checkpoint before analysis
4. **A/B Comparison:** Side-by-side run comparison
5. **Artifact Packs:** Structured, editable outputs for facilitation
6. **Boundary Hardening:** Language that prevents outputs from being read as authoritative

---

## 📁 Orientation Lab (`orientation-lab/`)

**Purpose:** Non-authoritative thinking tool for navigating uncertainty, disagreement, and complex situations.

### Root Files
```
orientation-lab/
├── package.json                    # React 19.2.0, Vite 7.2.4, TypeScript 5.9.3
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
├── tsconfig.app.json               # App-specific TS config
├── tsconfig.node.json              # Node-specific TS config
├── eslint.config.js                # ESLint configuration
├── index.html                      # Entry HTML
├── README.md                       # Project description
├── ORIENTATION_LAB_CONTENT.md      # UI text, prompts, example outputs
└── PHASE_0_CONSTITUTION.md         # Phase 0 constitution document
```

### Source Structure (`src/`)

```
src/
├── main.tsx                 # React entry point
├── App.tsx                  # Main application component
├── App.css                  # App-specific styles
├── index.css                # Global styles
│
├── styles/                   # Additional stylesheets
│   └── app.css                   # Main app styles
│
├── components/               # React components
│   ├── ArtifactPack.tsx          # Artifact pack display
│   ├── ArtifactView.tsx          # Artifact view component
│   ├── ErrorBoundary.tsx         # Error boundary wrapper
│   ├── FacilitatorNotes.tsx      # Facilitator notes component
│   ├── HotkeysHelp.tsx           # Keyboard shortcuts help
│   ├── PrimitiveEditor.tsx       # Primitive editor component
│   ├── RoomMode.tsx              # Room mode interface
│   ├── SessionBar.tsx            # Session bar component
│   ├── SignalPanel.tsx           # Signal panel component
│   ├── TemplateChooser.tsx       # Template selection
│   ├── Timeline.tsx              # Timeline component
│   ├── V1Scope.tsx               # V1 scope component
│   ├── ui.tsx                    # UI primitives (Card, Button, Chip, etc.)
│   └── pages/                    # Page components
│       ├── AboutPage.tsx          # About page
│       ├── HowToUsePage.tsx       # How to use page
│       └── WhoItsFor.tsx          # Who it's for page
│
├── hooks/                    # Custom React hooks
│   ├── useLocalStorageState.ts   # LocalStorage state hook
│   ├── useTimer.ts               # Timer hook
│   └── useUndo.ts                # Undo/redo hook
│
├── types/                     # TypeScript type definitions
│   ├── orientation.ts            # Orientation state types
│   └── session.ts                # Session store types
│
└── utils/                      # Utility functions
    ├── artifactPack.ts           # Build artifact packs
    ├── compress.ts               # Compression utilities
    ├── defaultState.ts           # Default state initialization
    ├── flow.ts                   # Flow status utilities
    ├── id.ts                     # ID generation
    ├── jsonIO.ts                 # JSON import/export
    ├── roomMode.ts               # Room mode utilities
    ├── sessions.ts               # Session management
    ├── share.ts                  # Share link generation
    ├── signals.ts                # Signal generation
    ├── storeKeys.ts              # Storage key constants
    ├── templates.ts              # Template management
    └── version.ts                # Version utilities
```

### Key Features

1. **Flow Steps:** Capture → Discriminate → Own → Produce
2. **Room Mode:** Dark interface for facilitation sessions
3. **Models:** Capture competing representations without forcing consensus
4. **Signals:** Surface structure, assumptions, disagreements, unknowns
5. **Artifact Packs:** Shareable orientation artifacts
6. **Templates:** Starter templates for common scenarios
7. **Share Links:** URL-based state sharing
8. **Non-Authoritative:** Explicitly does not forecast, optimize, or recommend

---

## 🛠️ Technology Stack

Both projects share:
- **React** 19.2.0
- **TypeScript** 5.9.3
- **Vite** 7.2.4
- **ESLint** 9.39.1
- **No external UI libraries** (custom components)

### Differences

**Pressure Lab:**
- Uses `recharts` for data visualization (if needed)
- Focus on constraint modeling and pressure analysis

**Orientation Lab:**
- Pure React (no charting library)
- Focus on facilitation and structured thinking

---

## 📝 Key Documents

### Pressure Lab
- `PRESSURE_LAB_CONTENT.md` - UI text, core prompts, example outputs

### Orientation Lab
- `ORIENTATION_LAB_CONTENT.md` - UI text, prompts, example outputs
- `PHASE_0_CONSTITUTION.md` - Phase 0 constitution

---

## 🚀 Development

Both projects use standard Vite commands:

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

---

## 🎯 Design Philosophy

Both tools share core principles:

1. **Non-Authoritative:** Outputs are descriptive, not prescriptive
2. **Human-First:** Judgment remains with people, not systems
3. **Legibility:** Make structure visible, not hidden
4. **Boundary Clarity:** Explicit about what the tool does NOT do
5. **Room-Ready:** Designed for facilitation and group decision-making

---

## 📊 File Counts

**Pressure Lab:**
- Components: 10
- Types: 6
- Utils: 11
- Total source files: ~33

**Orientation Lab:**
- Components: 16 (including 3 pages)
- Hooks: 3
- Types: 2
- Utils: 13
- Total source files: ~37

---

*Last updated: 2025-01-03*





