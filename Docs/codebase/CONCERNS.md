# Codebase Concerns

## 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | Three intended MVP modules are not reachable from the app shell | `src/App.tsx`, `src/components/BuildVsBuy.tsx`, `src/components/AiAnalyst.tsx`, `src/components/StakeholderLayer.tsx`, `Docs/MVP_PRD.md` | Build vs Buy, AI Analyst, and Ecosystem nav items currently show a placeholder page, despite components existing | Wire the existing components into `App.tsx` and pass required datasets |
| High | Logo.dev token is hardcoded in client code | `src/components/CompanyLogo.tsx` | Token is exposed to browser users and cannot be rotated without code changes | Move to an approved public token strategy, env-based build config, or server-side/proxy approach |
| Medium | No automated tests or CI | `package.json`, `docs/codebase/.codebase-scan.txt` | Regressions in filters, CSV parsing, source badges, and routing can ship unnoticed | Add unit tests for data helpers and component smoke/E2E coverage for critical flows |
| Medium | Static CSV app data has no runtime validation | `src/data/index.ts`, `src/data/csv.ts`, `dataset/processed/*.csv` | Bad CSV headers or malformed rows can silently become `Unknown` or break UI assumptions | Add schema validation during CSV generation or build |
| Medium | Recent updates and several dashboard metrics are hardcoded in UI | `src/components/MarketSnapshot.tsx` | Product may show stale or unsourced current-event claims unless manually updated | Move updates into source-linked dataset rows with date/source metadata |
| Medium | External map/logo services have no failure handling | `src/components/InteractiveIndiaMap.tsx`, `src/components/CompanyLogo.tsx` | Broken network calls can leave blank map tiles or missing logos | Add graceful fallbacks and verify behavior offline/blocked |
| Low | No lint/formatter config | `package.json`, `docs/codebase/.codebase-scan.txt` | Style drift and accidental complexity can accumulate | Add ESLint/Prettier or document intentional no-lint posture |

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Placeholder routing for completed-looking modules | App shell only renders first three pages | `src/App.tsx` | Prototype under-delivers on PRD scope | Render `BuildVsBuy`, `AiAnalyst`, and `StakeholderLayer` for their nav pages |
| Handwritten CSV parser without schema checks | Lightweight prototype data import | `src/data/csv.ts`, `src/data/index.ts` | Header drift or quoted edge cases may create bad UI data silently | Add schema assertions and row-level diagnostics |
| Large monolithic CSS file | UI evolved through multiple page refinements | `src/styles.css` | Hard to isolate layout regressions or delete dead styles | Split by module or introduce a documented styling convention |
| Hardcoded dashboard/supporting data | Fast prototype construction | `src/components/MarketSnapshot.tsx`, `src/components/CityCompare.tsx` | Source-backed product claim is weakened where values are not data-driven | Move constants into typed data files with source IDs |
| Standalone verification scripts | Manual visual/audit workflow | `artifacts/` | Checks may not be rerun consistently | Convert highest-value scripts into npm or CI commands |

## 3) Security Concerns

| Risk | OWASP category (if applicable) | Evidence | Current mitigation | Gap |
|------|--------------------------------|----------|--------------------|-----|
| Client-exposed Logo.dev token | A02 Cryptographic Failures / sensitive data exposure, broadly applicable | `src/components/CompanyLogo.tsx` | None beyond being a logo-service token | Token governance and rotation policy are unknown |
| External source links open in new tabs | N/A | `GccAtlas.tsx`, `Badges.tsx`, `CompanyLogo.tsx` | Uses `rel="noreferrer"` on external anchors seen in source | Continue applying this consistently |
| HTML generated for Leaflet div icons | A03 Injection if unescaped | `src/components/InteractiveIndiaMap.tsx` | City label is escaped with `escapeHtml` | Keep escaping if city labels ever become user-generated |
| No input validation beyond local UI filtering | A04 Insecure Design if public write flows are later added | `src/components/GccAtlas.tsx`, `src/components/StakeholderLayer.tsx` | Current app has no backend writes | Future claim/proof/correction submissions need server-side validation |

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Client-side filtering over all records | `src/components/GccAtlas.tsx`, `dataset/processed/gcc_records.csv` | Fine for 769 rows | Thousands of rows plus richer detail records may slow filtering and rendering | Add memoized indexes, virtualization, or backend search when data grows |
| Large static datasets and binaries in repo | `dataset/raw/`, `dataset/organized/`, `docs/codebase/.codebase-scan.txt` | Repo contains many PDFs/images and generated data | Clone/build and scanning cost increases | Keep raw evidence if needed, but separate deploy bundle from research archive |
| External images for company logos | `src/components/CompanyLogo.tsx` | Many table/detail logos may trigger many remote image requests | Rate limits, slow rendering, or broken logos | Cache selected logos or lazy-load only visible rows |
| Leaflet tile rendering depends on network | `src/components/InteractiveIndiaMap.tsx` | Map needs OpenStreetMap tiles | Demo can degrade offline or under network restrictions | Provide static fallback or preflight map check |

## 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|--------------|----------------------|
| `src/App.tsx` | Controls all page routing and currently diverges from available components | No git churn available; scan reports no commits | Update with focused routing tests/smoke checks |
| `src/components/GccAtlas.tsx` | Largest component, owns filtering, detail panel, export, source parsing, status labels | Component size: 27,430 bytes from file listing | Extract pure helpers and add unit tests before major changes |
| `src/styles.css` | Very large CSS file with accumulated responsive and module-specific rules | Truncated read showed 9,198 lines | Make scoped changes and verify screenshots across pages |
| `dataset/processed/*.csv` | App-critical data with sparse fields and confidence semantics | Dataset docs mention sparse legal fields and qualitative city values | Validate schemas before build and preserve caveats in UI |
| `scripts/process_gcc_dataset.py` | Handles raw file classification, PDF text/table extraction, visual renders, and reconciliation | Function list shows many responsibilities | Keep raw outputs immutable and add dry-run/report modes before changes |

## 6) `[ASK USER]` Questions

1. [ASK USER] Should the current prototype prioritize wiring the existing Build vs Buy, AI Analyst, and Ecosystem components into `App.tsx`, or are those intentionally parked for a later phase?
2. [ASK USER] Is the Logo.dev token intended to be public/client-side, or should it be moved out of the browser bundle before sharing the app?
3. [ASK USER] Should raw PDFs and generated extraction artifacts stay in this repo long term, or should the deployable app be split from the research/data archive?
4. [ASK USER] Which command should be the official verification command: `npm run build` only, or a new test/e2e command that wraps the existing artifact scripts?
5. [ASK USER] Should the app continue as a static CSV prototype, or is the next architecture step a backend/API for source updates, profile claims, and audit logs?

## 7) Evidence

- `src/App.tsx`
- `src/components/BuildVsBuy.tsx`
- `src/components/AiAnalyst.tsx`
- `src/components/StakeholderLayer.tsx`
- `src/components/GccAtlas.tsx`
- `src/components/MarketSnapshot.tsx`
- `src/components/CompanyLogo.tsx`
- `src/components/InteractiveIndiaMap.tsx`
- `src/data/index.ts`
- `src/data/csv.ts`
- `src/styles.css`
- `package.json`
- `dataset/README.md`
- `dataset/organized/06_app_ready/prototype_csv_build_summary.md`
- `dataset/organized/05_reconciliation/discrepancies.md`
- `Docs/MVP_PRD.md`
- `Docs/HANDOFF.md`
- `docs/codebase/.codebase-scan.txt`
