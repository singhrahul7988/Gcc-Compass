# Architecture

## 1) Architectural Style

- Primary style: static single-page React application backed by local CSV datasets and offline Python data-prep scripts.
- Why this classification: `src/main.tsx` mounts one React tree; `src/App.tsx` selects visible modules with local React state; `src/data/index.ts` imports local CSV files via Vite `?raw`; no backend/API server is present in the repo.
- Primary constraints:
  - Data trust is a product requirement: source IDs, source URLs, confidence scores, caveats, and unknown values are part of the UI contract.
  - The current frontend is static: runtime data comes from committed CSV files, not from a database or API.
  - Several intended product modules exist as components but are not currently rendered by the app shell.

## 2) System Flow

```text
index.html -> src/main.tsx -> App navigation -> src/data CSV imports -> feature component state/filtering -> browser UI
```

1. `index.html` defines `#root` and loads `/src/main.tsx`.
2. `src/main.tsx` imports Leaflet CSS, global CSS, and renders `<App />` in React `StrictMode`.
3. `src/App.tsx` imports processed data arrays from `src/data` and feature components from `src/components`.
4. `src/data/index.ts` imports committed CSVs from `dataset/processed/*.csv?raw`, parses them with `parseCsv`, and exports typed arrays plus `dataStats`.
5. Feature components perform client-side filtering, scoring, pagination, exporting, or local answer selection using component state and helper functions.
6. Browser-visible output includes confidence/source badges, source links, Logo.dev images, OpenStreetMap map tiles, and local CSV-derived records.

## 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| `src/main.tsx` | React root bootstrap and global CSS imports | Product logic | `src/main.tsx` |
| `src/App.tsx` | Shell navigation, active page state, passing datasets into pages | Parsing CSV or creating processed records | `src/App.tsx`, `src/data/index.ts` |
| `src/data/index.ts` | CSV imports, exported data types, parsed app datasets | UI rendering | `src/data/index.ts` |
| `src/data/csv.ts` | CSV parsing, `Unknown` normalization, list splitting, numeric score parsing | Product-specific recommendations | `src/data/csv.ts` |
| `GccAtlas` | Search/filter/sort/paginate/export GCC records and detail drawer | Dataset generation | `src/components/GccAtlas.tsx` |
| `MarketSnapshot` | Overview dashboard, macro cards, map, recent updates, source/trust summaries | Dataset extraction from raw PDFs | `src/components/MarketSnapshot.tsx` |
| `CityCompare` | City selection, comparison matrix, local scoring heuristic | Policy extraction or external geocoding | `src/components/CityCompare.tsx` |
| `BuildVsBuy` | Local route recommendation from team size, timeline, city, and preference | Legal/tax advice or backend financial modeling | `src/components/BuildVsBuy.tsx`, `Docs/MVP_PRD.md` |
| `AiAnalyst` | Deterministic local answers and refusal mode | Live LLM calls | `src/components/AiAnalyst.tsx`, `Docs/MVP_PRD.md` |
| `StakeholderLayer` | Stakeholder profile cards and CTA surface | Profile claiming workflow backend | `src/components/StakeholderLayer.tsx` |
| `scripts/` | Raw-to-organized and organized-to-processed data preparation | Browser rendering | `scripts/process_gcc_dataset.py`, `scripts/build_prototype_csvs.py` |

## 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Local CSV as app database | `src/data/index.ts`, `dataset/processed/*.csv` | Keeps the prototype static and easy to ship while preserving source-linked data. |
| Confidence/source display | `Badges.tsx`, `GccAtlas.tsx`, `MarketSnapshot.tsx`, `BuildVsBuy.tsx`, `StakeholderLayer.tsx` | Makes the trust layer visible in user-facing workflows. |
| `Unknown` to display-safe fallback | `src/data/csv.ts`, `GccAtlas.tsx` | Prevents sparse CSV fields from becoming false claims. |
| Client-side filtering and scoring | `GccAtlas.tsx`, `CityCompare.tsx`, `AiAnalyst.tsx`, `BuildVsBuy.tsx` | Enables interactive decision flows without a backend. |
| Source-linked correction/export actions | `GccAtlas.tsx` | Supports the product thesis of verifiable/correctable records. |
| Separate data-prep scripts | `scripts/process_gcc_dataset.py`, `scripts/refine_gcc_outputs.py`, `scripts/build_prototype_csvs.py` | Keeps raw document extraction and CSV creation outside the browser app. |

## 5) Known Architectural Risks

- App shell gap: `BuildVsBuy`, `AiAnalyst`, and `StakeholderLayer` are imported or present as components, but `src/App.tsx` renders a generic placeholder for `build`, `analyst`, and `ecosystem` pages. This prevents three PRD modules from being usable in the current app route.
- Client-bundled token: `src/components/CompanyLogo.tsx` hardcodes a Logo.dev token into frontend source, so it is exposed to every browser user.
- Static CSV architecture: updates require regenerating files and rebuilding the app; there is no live source refresh, audit trail UI, or backend validation service.
- Map and logo availability depend on third-party network services; no fallback retry or timeout handling is implemented.
- Recent updates in `MarketSnapshot.tsx` are hardcoded arrays rather than dataset-driven records.

## 6) Evidence

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/data/index.ts`
- `src/data/csv.ts`
- `src/components/GccAtlas.tsx`
- `src/components/MarketSnapshot.tsx`
- `src/components/CityCompare.tsx`
- `src/components/BuildVsBuy.tsx`
- `src/components/AiAnalyst.tsx`
- `src/components/StakeholderLayer.tsx`
- `src/components/InteractiveIndiaMap.tsx`
- `src/components/CompanyLogo.tsx`
- `scripts/process_gcc_dataset.py`
- `scripts/refine_gcc_outputs.py`
- `scripts/build_prototype_csvs.py`
- `Docs/MVP_PRD.md`
- `Docs/HANDOFF.md`
