# GCC Compass Handoff Summary

Last updated: 2026-09-25

## 1. Original Context

Rahul emailed Karthik Sridharan, Founder/CEO of Flexiple, asking for Flexiple's toughest problem and proposing that if he solved it, Flexiple should consider hiring him for a product internship.

Karthik replied with a challenge around India's Global Capability Centre (GCC) ecosystem:

- India has 2,000+ GCCs.
- The market is fragmented across advisors, lawyers, auditors, real estate firms, recruiters, payroll/EOR providers, state governments, and industry bodies.
- Different sources quote different numbers.
- Companies entering India rely on referrals because they cannot easily identify which cities, providers, costs, incentives, and GCC footprints are real.
- Karthik asked for a deck and working prototype in 2-3 days.

Rahul replied that the wedge would be buy-side intelligence for foreign companies evaluating India entry, using publicly verifiable datasets: MCA filings, regulatory notices, verified GCC footprints, compensation bands, etc.

Karthik then clarified that he envisioned this also as a way to attract existing ecosystem stakeholders: GCC advisors, Big 4, real estate firms, Nasscom, state governments, etc.

## 2. Current Product Thesis

We are building **GCC Compass**.

GCC Compass is an AI-powered decision tool for foreign companies evaluating India GCC or offshore team setup.

It helps an executive answer:

1. Where should we set up in India?
2. What will it cost?
3. Should we start with EOR/Flexiple-managed team, BOT, or direct entity?
4. Which ecosystem stakeholders can help, and why should we trust the data?

The buyer is the starting wedge, but the long-term platform pulls in ecosystem stakeholders.

Stakeholders can:

- claim profiles,
- publish proof,
- submit verified data,
- receive qualified demand signals.

## 3. Important Product Differentiation

Flexiple already has a GCC directory at:

https://flexiple.com/gcc/india

That page already does:

- GCC directory,
- company cards,
- city filters,
- sector filters,
- headcount/model filters,
- city counts,
- entity setup CTA.

So the prototype should **not** be a prettier clone of Flexiple's page.

Our prototype should be:

**Flexiple GCC Directory + decision intelligence + AI analyst + stakeholder trust layer.**

Missing layer we are building:

- multi-source public verification,
- confidence scores,
- source citations,
- city benchmarking,
- Build vs Buy calculator,
- AI Analyst,
- ecosystem stakeholder layer.

The key strategic insight:

**GCC Compass should not win by having the biggest list. It should win by making scattered, unevenly reliable data trustworthy through citations, confidence scores, verification status, and stakeholder correction flows.**

## 4. MVP Modules To Build

Build a polished single-page React/Vite app with these modules:

1. **Market Snapshot**
   - Macro cards: 2,117 GCCs, 3,728 units, 2.36M talent, USD 98.4B revenue.
   - Source: Zinnov-Nasscom GCC Landscape 2026.

2. **GCC Atlas**
   - Search/filter companies.
   - Fields: company, city, sector, functions, headcount band, source, confidence, verification status.
   - Click row/card to open detail drawer.

3. **City Benchmarking**
   - Compare cities like Bengaluru, Hyderabad, Pune, Delhi NCR, Chennai, Mumbai, Ahmedabad/GIFT City, Coimbatore.
   - Show strengths, risks, policy, talent, rent/cost caveats, best-fit use cases.

4. **Build vs Buy Calculator**
   - Inputs: city, team size, timeline, team mix, speed/control preference.
   - Outputs: EOR/Flexiple-managed team vs BOT vs direct entity recommendation.
   - Use assumptions with visible caveats.

5. **AI Analyst**
   - Optional Gemini API key later.
   - For MVP, use grounded local responses from CSV data.
   - If data is insufficient, answer: "Insufficient verified data in the GCC Compass database."
   - Every answer should show sources/confidence.

6. **Ecosystem Stakeholder Layer**
   - Stakeholder cards for advisors, Big 4, real estate firms, state governments, Nasscom/STPI, legal/tax, EOR/payroll, Flexiple.
   - CTAs: claim profile, submit proof, submit data, receive demand signals.

## 5. Files Created So Far

### Docs

- `Docs/Context.md`
  - Original task analysis, how it relates to Flexiple, Karthik's follow-up, strategic framing.

- `Docs/Deliverables.md`
  - Deck/prototype deliverable guidance.

- `Docs/research.md`
  - Full source map, source quality framework, public data sources, crawler/Tinyfish recommendation, schema ideas, ChatGPT/Gemini research synthesis.

- `Docs/MVP_PRD.md`
  - Mini PRD for GCC Compass MVP.

### Dataset Structure

Created:

```text
dataset/
  raw/
  organized/
  processed/
  sources/
  templates/
  notes/
```

Raw files stay under `dataset/raw`. Do not delete them.

### Source Inventory

- `dataset/sources/source_links.md`
  - Direct download/API source inventory.
  - Includes direct/source links for Zinnov, MCA/data.gov, SEZ, Gujarat/Maharashtra/UP/Tamil Nadu policy PDFs, IndusLaw, Dhruva, KPMG, Avasant, Mercer, Flexiple, GCC Index, real estate report pages.

### Processing Scripts

- `scripts/process_gcc_dataset.py`
  - Inventories raw files.
  - Classifies files by category.
  - Copies raw files into organized category folders without deleting/moving raw.
  - Extracts PDF text snippets.
  - Extracts PDF tables.
  - Renders visual PDF pages for layout review.
  - Creates merged company seed file.
  - Creates MCA keyword entity matches.
  - Creates discrepancy report.

- `scripts/refine_gcc_outputs.py`
  - Joins GCC Index CINs against MCA/data.gov where possible.
  - Creates high-value document map.
  - Creates data readiness summary.

- `scripts/build_prototype_csvs.py`
  - Creates prototype-ready CSVs from processed/organized data.

## 6. Raw Data Files Processed

Raw data currently includes 27 files:

- 23 PDFs
- 2 Excel files
- 1 large CSV from data.gov/MCA
- 1 screenshot

Notable raw files:

- `zinnov-nasscom-india-gcc-landscape-report-2026.pdf`
- `flexiple_india_verified_centers.xlsx`
- `GCC_Index_All_Companies.xlsx`
- `data_gov data.csv`
- `India_Office_Figures_Q2_2026.pdf`
- `26-insights-india-office-market-dynamics-q2-2026.pdf`
- `india-office-market-report-q2-2026.pdf`
- `Gujarat Global Capability Center.pdf`
- `UP_GCC-Policy-Eng_050625.pdf`
- `Scheme to promote GCC.pdf`
- `global-cabability-centres-compressed_1.pdf`
- `Dhruva-GCC-Report-2025.pdf`
- `Establish gcc 2025.pdf`
- `cognizant-avasant-gcc-services-radarview-2025.pdf`
- KPMG provider lens PDF
- SEZ PDFs

## 7. Dataset Processing Results

Processing output summary:

- Raw files reviewed: 27
- PDFs processed: 23
- Spreadsheet/CSV files processed: 3
- Extracted PDF tables: 475
- Merged company seed rows: 769
- Cross-directory company matches: 79
- GCC Index timeline rows: 503
- MCA keyword entity matches: 49

Important generated files:

- `dataset/organized/processing_report.md`
- `dataset/organized/00_inventory/raw_file_inventory.csv`
- `dataset/organized/03_extracted_tables/`
- `dataset/organized/02_visual_review/`
- `dataset/organized/05_reconciliation/discrepancies.md`
- `dataset/organized/06_app_ready/company_seed_merged.csv`
- `dataset/organized/06_app_ready/gcc_index_activity_timeline.csv`
- `dataset/organized/06_app_ready/gcc_index_mca_cin_verified.csv`
- `dataset/organized/06_app_ready/mca_keyword_entity_matches.csv`
- `dataset/organized/06_app_ready/high_value_document_map.csv`
- `dataset/organized/06_app_ready/prototype_data_readiness.md`

## 8. App-Ready CSVs Generated

These are in `dataset/processed/` and should be used by the React app.

- `dataset/processed/gcc_records.csv`
  - 769 rows.
  - Use for GCC Atlas.
  - Source: Flexiple + GCC Index merged seed.
  - Legal/entity fields are sparse; show verified/unknown honestly.

- `dataset/processed/city_benchmarks.csv`
  - 8 rows.
  - Use for City Benchmarking.
  - Cities: Bengaluru, Hyderabad, Pune, Delhi NCR, Chennai, Mumbai, Ahmedabad/GIFT City, Coimbatore.
  - Rent/salary fields are conservative qualitative values until real-estate tables are manually cleaned.

- `dataset/processed/state_policies.csv`
  - 4 rows.
  - States: Gujarat, Uttar Pradesh, Tamil Nadu, Maharashtra.
  - Contains source-backed summaries and caveats.

- `dataset/processed/stakeholders.csv`
  - 19 rows.
  - Use for stakeholder layer.

- `dataset/processed/assumptions.csv`
  - 10 rows.
  - Use for Build vs Buy assumptions drawer.

Other useful processed files:

- `dataset/processed/company_seed_merged.csv`
- `dataset/processed/gcc_index_activity_timeline.csv`
- `dataset/processed/gcc_index_mca_cin_verified.csv`
- `dataset/processed/mca_keyword_entity_matches.csv`
- `dataset/processed/raw_file_inventory.csv`

## 9. Important Reconciliation Findings

Use Zinnov-Nasscom 2026 as the current macro source:

- 2,117 GCCs
- 3,728 GCC units
- 2.36M installed GCC talent
- USD 98.4B GCC revenue
- 506 G2000 GCCs in India
- 504 PE-backed/acquired GCCs
- 1,200+ GCCs with AI/ML capabilities
- 250+ dedicated AI/ML CoEs
- 250K+ AI/ML professionals

Older documents mention:

- 1,700 GCCs
- 2,975 units
- 1.9M employees
- USD 64.6B revenue

These are historical trend points, not conflicts, if labelled by year/source.

Other caveats:

- Flexiple and GCC Index are partial directories, not total ecosystem counts.
- SEZ/STPI files prove facility/zone status, not that a GCC tenant receives SEZ tax benefits.
- MCA keyword matches are noisy and should be discovery leads only.
- `data_gov data.csv` appears partial because only 3 GCC Index CINs matched MCA rows.
- Salary/remuneration sources are often brochure/gated; avoid exact salary claims unless visible and source-backed.

## 10. What The App Should Show About Data Trust

Every major record or answer should show:

- source IDs,
- source URLs or source names,
- confidence score,
- verification status,
- caveat/notes,
- last checked date.

This is not just backend hygiene. This is the core product differentiation.

## 11. Suggested Next Steps In New Chat

Start here:

1. Inspect the workspace.
2. Read this handoff file.
3. Read `Docs/MVP_PRD.md`.
4. Read `dataset/organized/06_app_ready/prototype_csv_build_summary.md`.
5. Build React/Vite app in this folder.
6. Load CSV data from `dataset/processed/` into app source files.

Recommended frontend stack:

- React + Vite
- Tailwind CSS
- lucide-react icons
- local CSV import/conversion to TS arrays, or copy CSV into `src/data/*.ts`

Suggested app structure:

```text
src/
  data/
    gccRecords.ts
    cityBenchmarks.ts
    statePolicies.ts
    stakeholders.ts
    assumptions.ts
  components/
    MarketSnapshot.tsx
    GccAtlas.tsx
    CityCompare.tsx
    BuildVsBuy.tsx
    AiAnalyst.tsx
    StakeholderLayer.tsx
    SourceBadge.tsx
    ConfidenceBadge.tsx
  App.tsx
```

Initial data import strategy:

- Convert `dataset/processed/*.csv` to TypeScript arrays in `src/data/`.
- Do not build backend yet.
- Keep source/caveat fields visible in UI.

Prototype UI direction:

- Executive cockpit, not marketing landing page.
- Dense but clean.
- Tabs or sections:
  - Overview
  - GCC Atlas
  - City Compare
  - Build vs Buy
  - AI Analyst
  - Ecosystem
- Source/confidence badges everywhere.

AI Analyst MVP:

- Start with deterministic local answers from dataset.
- Add optional Gemini API settings only after core UI works.
- Must refuse when data is insufficient.

Build vs Buy MVP:

- Inputs: team size, timeline, city, team mix, speed vs control.
- Use `assumptions.csv` for macro assumptions.
- Output recommendation:
  - small/urgent team: EOR/Flexiple-managed route,
  - mid-size/transitional: BOT/managed team,
  - large/long-term: direct entity/GCC.
- Show assumption drawer and legal/tax disclaimer.

## 12. Current Best Pitch To Karthik

"I started with the buyer wedge: a foreign company deciding India entry. But I built the system so ecosystem stakeholders have a reason to join, verify, contribute data, and receive qualified demand signals. The core product is not just a directory. It is a trust layer across fragmented GCC data: citations, confidence scores, verification status, and correction workflows."

## 13. Do Not Forget

- Do not delete raw files.
- Do not claim exact salary/rent values unless source-backed.
- Do not make a clone of Flexiple's existing GCC directory.
- Keep source trust visible.
- Keep the prototype working over perfect.
- Deck comes after prototype story is visible.
