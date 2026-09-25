# Testing Patterns

## 1) Test Stack and Commands

- Primary test framework: `[TODO]` no test framework is configured in `package.json`.
- Assertion/mocking tools: `[TODO]` none found.
- Commands:

```bash
[TODO] no run-all-tests command exists
[TODO] no unit-test command exists
[TODO] no integration/e2e command exists
[TODO] no coverage command exists
```

The only quality-related npm command is:

```bash
npm run build
```

It runs:

```bash
tsc && vite build
```

## 2) Test Layout

- Test file placement pattern: `[TODO]` no committed test files were found by the codebase scan.
- Naming convention: `[TODO]` not established.
- Setup files and where they run: `[TODO]` no test setup files found.
- UI verification artifacts: `artifacts/verify_*.py`, `artifacts/capture_*.py`, screenshots, and `.playwright-mcp/` logs exist, but they are standalone artifacts rather than an integrated test suite.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | No configured suite found | CSV parser, scoring helpers, local answer logic | Good candidates: `parseCsv`, `splitList`, `score`, `answerQuestion`, city scoring |
| Integration | No configured suite found | CSV imports into app pages | Vite raw CSV import path should be validated by build |
| E2E | Not integrated | Overview, Atlas filters, City Compare | Python verification artifacts suggest manual/browser audit work happened, but no command is wired |
| Type check | Yes via build | All `src` TypeScript | `npm run build` invokes `tsc` |

## 4) Mocking and Isolation Strategy

- Main mocking approach: `[TODO]` no mock pattern found.
- Isolation guarantees: `[TODO]` none documented.
- Common failure mode in tests: `[TODO]` no test results or flaky-test records found.
- External UI dependencies to mock in future: Logo.dev images, OpenStreetMap tiles, browser Blob export, `mailto:` correction flow.

## 5) Coverage and Quality Signals

- Coverage tool + threshold: `[TODO]` none found.
- Current reported coverage: `[TODO]` none found.
- Known gaps/flaky areas:
  - No automated coverage for CSV parsing edge cases.
  - No automated coverage for GCC Atlas filtering/export/detail behavior.
  - No automated coverage for AI Analyst refusal behavior.
  - No automated coverage for the App shell divergence where several modules are placeholders.
  - No CI pipeline was detected.

## 6) Evidence

- `package.json`
- `tsconfig.json`
- `docs/codebase/.codebase-scan.txt`
- `artifacts/verify_atlas_flows.py`
- `artifacts/verify_city_compare.py`
- `artifacts/verify_atlas_filters.py`
- `.playwright-mcp/`
- `src/data/csv.ts`
- `src/components/AiAnalyst.tsx`
- `src/components/GccAtlas.tsx`
