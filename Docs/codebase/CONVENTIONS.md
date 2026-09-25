# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | React component files use PascalCase; data helper files use lowercase | `GccAtlas.tsx`, `MarketSnapshot.tsx`, `csv.ts` | `src/components/`, `src/data/` |
| Functions/methods | camelCase for helpers and component-local functions | `parseCsv`, `splitList`, `getDisplayRecord`, `answerQuestion` | `src/data/csv.ts`, `src/components/GccAtlas.tsx`, `src/components/AiAnalyst.tsx` |
| Types/interfaces | PascalCase type names | `GccRecord`, `CityBenchmark`, `Assumption`, `DisplayRecord` | `src/data/index.ts`, `src/components/GccAtlas.tsx` |
| Constants/env vars | camelCase or Pascal-like const arrays/objects; no env vars found | `navItems`, `cityOrder`, `LOGO_DEV_TOKEN` | `src/App.tsx`, `src/components/CityCompare.tsx`, `src/components/CompanyLogo.tsx` |
| CSS classes | kebab-case descriptive classes | `app-shell`, `atlas-detail-panel`, `city-summary-card` | `src/styles.css`, component `className` values |

## 2) Formatting and Linting

- Formatter: `[TODO]` no formatter config found.
- Linter: `[TODO]` no linter config or `npm run lint` script found.
- Most relevant enforced rules: TypeScript `strict`, `forceConsistentCasingInFileNames`, `isolatedModules`, and `allowJs: false`.
- Run commands: `npm run build` performs `tsc && vite build`; no lint or format command exists.

## 3) Import and Module Conventions

- Import grouping/order: imports generally place external packages first, then local components/data; no automated rule is configured.
- Alias vs relative import policy: relative imports are used; no `paths` alias is configured in `tsconfig.json`.
- Public exports/barrel policy: `src/data/index.ts` acts as a data barrel; components are imported directly from their files.
- Asset/data import pattern: CSV files are imported with Vite raw query syntax, for example `../../dataset/processed/gcc_records.csv?raw`.

## 4) Error and Logging Conventions

- Error strategy by layer: UI code generally uses fallbacks such as `Unknown`, `Not available`, empty arrays, and deterministic refusal text instead of thrown errors.
- Logging style and required context fields: `[TODO]` no logging library or console logging convention found in source.
- Sensitive-data redaction rules: `[TODO]` no redaction policy or secret-handling convention found; `CompanyLogo.tsx` currently exposes a Logo.dev token in client source.
- User-facing refusal: `AiAnalyst` returns "Insufficient verified data in the GCC Compass database." when local data does not support an answer.

## 5) Testing Conventions

- Test file naming/location rule: `[TODO]` no test files or configured test runner found.
- Mocking strategy norm: `[TODO]` no mocks found.
- Coverage expectation: `[TODO]` no coverage tool or threshold found.
- Verification artifacts: `artifacts/verify_*.py` and screenshots exist, but they are not integrated into `package.json`.

## 6) Evidence

- `package.json`
- `tsconfig.json`
- `src/App.tsx`
- `src/data/index.ts`
- `src/data/csv.ts`
- `src/components/GccAtlas.tsx`
- `src/components/AiAnalyst.tsx`
- `src/components/CompanyLogo.tsx`
- `src/styles.css`
- `artifacts/`
- `docs/codebase/.codebase-scan.txt`
