# Codebase Structure

## 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `src/` | React/Vite application source | `src/main.tsx`, `src/App.tsx`, `src/components/`, `src/data/` |
| `src/components/` | Feature UI components for overview, atlas, city compare, build-vs-buy, AI analyst, stakeholder layer, badges, logos, and map | `src/components/*.tsx` |
| `src/data/` | CSV import, parsing helpers, and TypeScript data shapes | `src/data/index.ts`, `src/data/csv.ts` |
| `dataset/processed/` | App-consumed CSV datasets | `dataset/processed/gcc_records.csv`, `dataset/processed/city_benchmarks.csv`, `dataset/processed/stakeholders.csv` |
| `dataset/organized/` | Processed intermediate outputs, extracted tables, visual review, reconciliation notes, and app-ready source files | `dataset/organized/processing_report.md`, `dataset/organized/06_app_ready/prototype_data_readiness.md` |
| `dataset/raw/` | Raw PDFs, spreadsheets, CSV, and screenshots used as evidence | `dataset/raw/`, `Docs/HANDOFF.md` |
| `dataset/sources/` | Source inventory for dataset provenance | `dataset/sources/source_links.md` |
| `dataset/templates/` | CSV schema templates for manual/processed data | `dataset/templates/*.csv` |
| `scripts/` | Python data-processing scripts | `scripts/process_gcc_dataset.py`, `scripts/refine_gcc_outputs.py`, `scripts/build_prototype_csvs.py` |
| `Docs/` | Product context, PRD, handoff, deliverables, research reports | `Docs/Context.md`, `Docs/MVP_PRD.md`, `Docs/HANDOFF.md` |
| `artifacts/` | UI audit scripts and generated screenshots for previous verification work | `artifacts/verify_atlas_flows.py`, `artifacts/*.png` |
| `.playwright-mcp/` | Captured browser/page logs | `.playwright-mcp/` |
| `dist/` | Built Vite output; generated artifact, not source of conventions | `dist/` |
| `node_modules/` | Installed dependencies; generated artifact | `node_modules/` |

## 2) Entry Points

- Main runtime entry: `src/main.tsx`.
- Browser HTML entry: `index.html` loads `/src/main.tsx`.
- App shell: `src/App.tsx` owns active page state and routes between nav views.
- Secondary entry points: Python scripts in `scripts/` are command-line data-pipeline utilities.
- How entry is selected: `package.json` scripts call Vite; `index.html` points Vite to `src/main.tsx`.

## 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| App shell (`src/App.tsx`) | Navigation, topbar, active page selection, passing parsed datasets to feature components | Dataset parsing, heavy per-feature UI logic, source-specific data cleanup |
| Feature components (`src/components/*.tsx`) | UI state and presentation for one product module | Raw CSV parsing, generated dataset writes, cross-module global state |
| Shared UI helpers (`Badges`, `CompanyLogo`) | Reusable visual helpers for trust badges and logos | Product-specific filtering or recommendation logic |
| Data layer (`src/data/`) | CSV raw imports, parser, exported typed arrays, simple normalization helpers | UI rendering, DOM APIs, dataset-generation logic |
| Dataset workspace (`dataset/`) | Raw, organized, processed, and source-linked data files | React component logic |
| Processing scripts (`scripts/`) | One-off or repeatable conversion from raw/organized source material into app CSVs | Browser UI behavior |

## 4) Naming and Organization Rules

- File naming pattern: React components use PascalCase filenames such as `GccAtlas.tsx`, `CityCompare.tsx`, `MarketSnapshot.tsx`; data helpers use lowercase names such as `csv.ts`.
- Directory organization pattern: source is organized by layer (`components`, `data`) rather than by route folder.
- Import aliasing or path conventions: no path aliases are configured; imports are relative.
- Generated-vs-source boundary: `dist/`, `node_modules/`, extracted tables, rendered PDF previews, and screenshots are generated or data artifacts and should not define source-code conventions.

## 5) Evidence

- `index.html`
- `package.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/components/`
- `src/data/index.ts`
- `src/data/csv.ts`
- `scripts/`
- `dataset/README.md`
- `dataset/organized/processing_report.md`
- `dataset/organized/06_app_ready/prototype_csv_build_summary.md`
- `Docs/HANDOFF.md`
- `docs/codebase/.codebase-scan.txt`
