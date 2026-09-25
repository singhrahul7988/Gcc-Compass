# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript with React TSX | `src/main.tsx`, `src/App.tsx`, `tsconfig.json` |
| Runtime + version | Node.js version is `[TODO]`; no `.nvmrc`, `.node-version`, or `engines` field was found | `package.json`, `docs/codebase/.codebase-scan.txt` |
| Package manager | npm | `package-lock.json`, `package.json` |
| Module/build system | ESM package, Vite, React plugin, TypeScript `moduleResolution: Bundler` | `package.json`, `vite.config.ts`, `tsconfig.json` |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| `react` | `^19.1.1` | UI rendering and stateful components | `package.json` |
| `react-dom` | `^19.1.1` | Mounts the React app into `#root` | `package.json`, `src/main.tsx` |
| `vite` | `^7.1.7` | Local dev server and production bundler | `package.json`, `vite.config.ts` |
| `typescript` | `^5.9.2` | Strict compile-time type checking | `package.json`, `tsconfig.json` |
| `@vitejs/plugin-react` | `^5.0.3` | Vite React transform/plugin | `package.json`, `vite.config.ts` |
| `lucide-react` | `^0.544.0` | Icon set used across UI controls and cards | `package.json`, `src/App.tsx`, `src/components/*.tsx` |
| `leaflet` | `^1.9.4` | Interactive map rendering base library | `package.json`, `src/components/InteractiveIndiaMap.tsx` |
| `react-leaflet` | `^5.0.0` | React bindings for Leaflet map components | `package.json`, `src/components/InteractiveIndiaMap.tsx` |
| `@types/leaflet` | `^1.9.22` | Leaflet TypeScript definitions; listed in `dependencies` | `package.json` |

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| TypeScript compiler | Build-time type check through `tsc` | `package.json`, `tsconfig.json` |
| Vite | Dev server, asset imports, CSV `?raw` imports, production build | `package.json`, `vite.config.ts`, `src/data/index.ts` |
| Python scripts | Dataset processing and prototype CSV generation | `scripts/process_gcc_dataset.py`, `scripts/refine_gcc_outputs.py`, `scripts/build_prototype_csvs.py` |
| Playwright-style verification artifacts | UI audit/capture scripts and screenshots; not wired into npm scripts | `artifacts/`, `.playwright-mcp/`, `package.json` |
| Linter | `[TODO]` no linter config or npm lint script found | `package.json`, `docs/codebase/.codebase-scan.txt` |
| Formatter | `[TODO]` no Prettier or formatter config found | `docs/codebase/.codebase-scan.txt` |

## 4) Key Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

There is no committed `test`, `lint`, or `format` script in `package.json`.

## 5) Environment and Config

- Config sources: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`.
- Required env vars: `[TODO]` none are declared in an `.env.example` or read through `import.meta.env`.
- Deployment/runtime constraints: Vite builds a static frontend from local CSV files imported through `?raw`; no backend process is defined in this repo.
- Client-side external asset token: `src/components/CompanyLogo.tsx` includes a Logo.dev token in source.

## 6) Evidence

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `src/data/index.ts`
- `src/components/InteractiveIndiaMap.tsx`
- `src/components/CompanyLogo.tsx`
- `docs/codebase/.codebase-scan.txt`
