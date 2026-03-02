# BUILD LOG — Omega RC + Protocol Site

## Block 1 — Structure & Routing (OMEGA-B)
**Status:** Done

**What changed:**
- Created `BUILD_PLAN.md` at repo root with build blocks, mode assignments, and execution workflow
- Created `BUILD_LOG.md` at repo root for tracking block completion

**Verified working:**
- Both files exist at repo root
- Build plan structure matches requirements
- Execution workflow defined

**Known issues:**
- None

---

## Block 2 — Omega RC Input→Output Path (OMEGA-B)
**Status:** Done

**What changed:**
- Increased MAX_INPUT_LENGTH from 600 to 2000 characters
- Added `validateInput()` function on server side to reject URLs and content exceeding limits
- Added hard URL rejection on client side (prevents API call)
- Updated server to always return 200 with fallback scaffold for URL/too_long cases (never error-blocks user)
- Updated UI placeholder and helper text to show "Short text only (max 2,000 characters). URLs not supported yet."
- Added explicit character limit messaging in UI
- Created verification checks document for 3 test scenarios

**Verified working:**
- Server validates input before LLM call (URLs rejected, length checked)
- Client prevents URL submission before API call
- Server always returns 200 with scaffold (even for invalid inputs, uses fallback)
- UI shows clear error messages for URLs and content exceeding limits
- All 5 sections (summary, assumptions, evidence, constraints, tradeoffs) always present in response
- Fallback scaffold structure matches expected format

**Known issues:**
- None

---

## Block 3 — Omega RC UI Polish for Comprehension (OMEGA-V)
**Status:** Done

**What changed:**
- Updated main page copy: Title "Omega RC", subtitle "Claim X-Ray for screenshots, headlines, and short posts", helper line, CTA "X-ray this claim"
- Added 3 example chips (Public claim, Product promise, Policy statement) that populate input on click
- Removed all dev chrome: console.log statements, removed long-form GPT link, removed dev-only messaging
- Updated workspace page section labels: "What it claims", "What it assumes", "What's actually shown", "What's missing / unclear", "Other framings"
- Added collapsed Advanced section with Export functionality (Copy to clipboard + Download .txt)
- Export includes all 5 sections plus source text in markdown format
- Made Advanced section optional (collapsed by default, shows editable fields when open)
- Added mobile-responsive padding and flex-wrap for smaller screens
- Simplified footer (removed marketing copy, added "Analyze another claim" link)

**Verified working:**
- Main page shows clear, scannable copy with example chips
- One-click examples populate input correctly
- Workspace page shows 5 sections with correct labels
- Advanced section collapses/expands correctly
- Export functions work (copy to clipboard and download .txt)
- Mobile layout is readable with responsive padding
- No dev chrome visible in normal use

**Known issues:**
- None

---

## Block 4 — Omega Protocol Site Pages (OMEGA-B)
**Status:** Done

**What changed:**
- Created ProtocolLayout component with shared navigation and footer
- Created ProtocolNav component with navigation: What Omega Is, How It's Used, Protocols, Stewardship, Contact
- Created Home page (/) with sections: Hero, Problem, What Omega Does, How Omega Is Used, Where This Applies
- Created How It's Used parent page with links to Examples and Industries
- Created Examples page with 6 examples (Research Claim, Policy Statement, Product Promise, Technical Architecture, Business Strategy, Scientific Finding)
- Created Industries page with 4 industry groups (Research & Academia, Policy & Governance, Technology & Engineering, Business & Strategy)
- Created Protocols index page listing all 6 protocols
- Created 6 protocol pages (omega, omega-a, omega-e, omega-s, omega-u, omega-c) with template structure: What it inspects, When to use, Structure, Micro-example, Where it applies
- Created Stewardship page with Principles, Governance, and Use sections
- Created Contact page with Protocol Inquiries, Technical Support, and Contributions sections
- All pages use minimal styling: large margins, high legibility, no animation, neutral tone
- Omega RC app remains accessible at /explain

**Verified working:**
- All routes render correctly: /, /how-its-used, /how-its-used/examples, /how-its-used/industries, /protocols, /protocols/omega, /protocols/omega-a, /protocols/omega-e, /protocols/omega-s, /protocols/omega-u, /protocols/omega-c, /stewardship, /contact
- Navigation works across all pages
- Copy is neutral and infrastructure-focused (no marketing, no pricing, no funnels)
- Layout is readable with generous whitespace and clear typography
- No broken imports or lint errors
- Build passes successfully
- Omega RC at /explain remains intact and functional

**Known issues:**
- None

---

## Block 4.1 — Fix Protocol Names + Canonical Copy (OMEGA-B)
**Status:** Done

**What changed:**
- Updated protocol page headings to canonical names: Omega-A (Alignment), Omega-E (Epistemics), Omega-S (Stress), Omega-U (Uncertainty), Omega-C (Control)
- Updated "What it inspects" sections with canonical one-sentence descriptions:
  - Omega-A: decision-boundary alignment (mandate, authority signals, decision substitution, value injection, control preservation)
  - Omega-E: epistemic state extraction (what is known, unknown, uncertain, and why)
  - Omega-S: stress testing (scenario completeness, reverse stress, BAU integration)
  - Omega-U: uncertainty visibility (bounds, sensitivity, fragility, confidence qualifiers)
  - Omega-C: control/authority boundaries (override, escalation, autonomy ceilings, operator agency)
- Updated Protocols index page with correct names and descriptions
- Updated Industries page protocol references for consistency

**Verified working:**
- All protocol page titles match canonical names
- All "What it inspects" sections match canonical descriptions
- Protocols index shows correct names and descriptions
- Industries page protocol references are consistent
- No lint errors

**Known issues:**
- None

---

## Block 5 — PDFs for Omega + Omega-A (OMEGA-B)
**Status:** Done

**What changed:**
- Created 2-page PDF HTML files for Omega and Omega-A protocols
- Omega PDF includes: structure diagram, sequence, stopping rule, what it's not (page 1); worked example with skin cancer claim (page 2)
- Omega-A PDF includes: structure diagram, sequence, stopping rule, what it's not (page 1); worked example with deploy AI system recommendation (page 2)
- Added "Download PDF" links on /protocols/omega and /protocols/omega-a pages
- PDFs stored in /public/pdfs as HTML files (printable to PDF via browser)

**Verified working:**
- PDF HTML files render correctly with proper formatting
- Download links work and open PDFs in new tab
- PDFs include all required elements: structure diagram, sequence, stopping rule, what it's not, worked examples
- Examples match agreed content (skin cancer claim for Omega, deploy AI system for Omega-A)

**Known issues:**
- None

---

## Block 5.1 — Produce Real PDFs + Fix Links (OMEGA-B)
**Status:** Done

**What changed:**
- Renamed HTML sources: omega.html -> omega-print.html, omega-a.html -> omega-a-print.html
- Created scripts/render-pdfs.mjs using Playwright to generate PDFs from print HTML sources
- Added playwright to devDependencies
- Added npm script "pdf:build": "node scripts/render-pdfs.mjs"
- Updated protocol page links: /protocols/omega and /protocols/omega-a now link to .pdf files with download attribute
- Script generates A4 PDFs with 15mm margins, printBackground enabled

**Verified working:**
- HTML print sources renamed correctly
- Script created and executable
- Links updated to point to .pdf files
- Package.json updated with playwright dependency and pdf:build script
- No lint errors

**Known issues:**
- None

**Note:** Run `npm install` to install playwright, then `npm run pdf:build` to generate PDFs. PDFs will be created at public/pdfs/omega.pdf and public/pdfs/omega-a.pdf.

---

## Block 5.1 — Finish Block 5.1 (Generate + Verify PDFs) (OMEGA-B)
**Status:** Done

**What changed:**
- Installed playwright and chromium browser binaries
- Generated PDFs using npm run pdf:build
- Verified PDFs exist: omega.pdf (142KB), omega-a.pdf (160KB)
- Committed PDFs to git

**Verified working:**
- PDFs generated successfully via Playwright
- Files exist at public/pdfs/omega.pdf and public/pdfs/omega-a.pdf
- PDFs are valid PDF documents (version 1.4)
- Links on /protocols/omega and /protocols/omega-a point to .pdf files with download attribute
- PDFs committed to git repository

**Known issues:**
- PDFs show 3 pages instead of 2 (likely due to page break positioning; content is correct)

---

## Block 5.1 — Fix PDFs to Exactly 2 Pages (OMEGA-B)
**Status:** Done

**What changed:**
- Replaced CSS with strict print system using fixed A4 .page containers
- Wrapped content in exactly 2 .page divs per PDF
- Added compact styling (box, tight, no-break classes) to sequence, stopping rule, and "What It's Not" sections
- Reduced font sizes and margins to fit content on 2 pages
- Regenerated PDFs using npm run pdf:build

**Verified working:**
- omega.pdf: exactly 2 pages (verified via file command and /Count check)
- omega-a.pdf: exactly 2 pages (verified via file command and /Count check)
- Both PDFs are valid PDF documents (version 1.4)
- PDFs committed to git

**Known issues:**
- None

