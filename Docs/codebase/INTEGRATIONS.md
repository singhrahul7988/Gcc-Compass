# External Integrations

## 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|--------------------------|---------|------------|-------------|----------|
| Local processed CSV files | Local static data files | Primary app data source for GCC records, city benchmarks, assumptions, stakeholders, and state policies | None | High | `src/data/index.ts`, `dataset/processed/*.csv` |
| Logo.dev image service | External image API | Company logo images by domain or company name | Client-side token in query string | Medium | `src/components/CompanyLogo.tsx` |
| OpenStreetMap tile endpoint | External map tile service | Leaflet base map tiles for India landscape view | No app credential configured | Medium | `src/components/InteractiveIndiaMap.tsx` |
| Browser `mailto:` handler | External client protocol | Submit correction email draft for GCC Atlas records | User email client | Low | `src/components/GccAtlas.tsx` |
| Browser Blob/Object URL APIs | Browser API | Export current or filtered GCC Atlas rows as CSV | None | Low | `src/components/GccAtlas.tsx` |
| Public web source URLs in datasets | External evidence links | Open source references from records and source badges | Varies by source | High for trust layer | `dataset/sources/source_links.md`, `dataset/processed/gcc_records.csv` |

No application database, backend API, queue, auth provider, payment provider, analytics SDK, or monitoring integration is defined in source.

## 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|------|------|--------------|----------|----------|
| `dataset/processed/*.csv` | Static app database consumed by Vite | `src/data/index.ts` imports `?raw`, `parseCsv` converts to arrays | Data is bundled at build time; changes require regeneration and rebuild | `src/data/index.ts`, `src/data/csv.ts` |
| `dataset/raw/` | Raw evidence archive | Python scripts and manual review | Large binary/PDF inputs; must not be treated as clean app data | `dataset/README.md`, `Docs/HANDOFF.md` |
| `dataset/organized/` | Intermediate processed artifacts, extracted tables, visual reviews, reconciliation notes | Python scripts and manual review | Extracted PDF tables can be inaccurate without manual cleanup | `dataset/organized/processing_report.md`, `dataset/organized/06_app_ready/prototype_data_readiness.md` |
| `dist/` | Static build output | Vite build | Generated artifact; should not be manually edited | `dist/`, `package.json` |

## 3) Secrets and Credentials Handling

- Credential sources: no `.env.example`, `.env.template`, or `import.meta.env` usage found.
- Hardcoding checks: `LOGO_DEV_TOKEN` is hardcoded in `src/components/CompanyLogo.tsx`.
- Rotation or lifecycle notes: `[ASK USER]` Should the Logo.dev token be moved to an environment variable or proxy service before public deployment?

## 4) Reliability and Failure Behavior

- Retry/backoff behavior: none implemented for Logo.dev images or OpenStreetMap tiles.
- Timeout policy: none configured in application code.
- Circuit-breaker or fallback behavior: Logo.dev requests use `fallback=monogram`; `CompanyLogo` does not define `onError` handling. The AI Analyst has a deterministic refusal mode for insufficient local evidence.
- Offline/local behavior: app data loads from bundled CSVs, but logos and map tiles require network access.

## 5) Observability for Integrations

- Logging around external calls: no logging found.
- Metrics/tracing coverage: no observability package or config found.
- Missing visibility gaps:
  - No signal when Logo.dev or map tiles fail.
  - No runtime tracking of source-link clicks, exports, or correction submissions.
  - No backend audit log for profile claims, proof submissions, or data corrections.

## 6) Evidence

- `src/data/index.ts`
- `src/data/csv.ts`
- `src/components/CompanyLogo.tsx`
- `src/components/InteractiveIndiaMap.tsx`
- `src/components/GccAtlas.tsx`
- `src/components/AiAnalyst.tsx`
- `dataset/README.md`
- `dataset/sources/source_links.md`
- `dataset/organized/processing_report.md`
- `dataset/organized/06_app_ready/prototype_data_readiness.md`
- `package.json`
- `docs/codebase/.codebase-scan.txt`
