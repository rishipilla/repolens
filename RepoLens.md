# RepoLens

**AI-powered codebase navigation and contribution discovery.**

RepoLens helps developers understand an unfamiliar open-source project before they touch the code. It turns repository signals into a visual architecture map, file context, a realistic first contribution and a maintainer-friendly GitHub issue draft.

> RepoLens turns the first hour of understanding an unfamiliar codebase into a few minutes.

## Problem

Understanding an unfamiliar open-source project can take hours. Developers have to piece together the stack, entry points, dependencies and conventions before they can identify a contribution that is small enough to ship safely.

## Solution

RepoLens maps a repository into a focused developer workspace:

- Repository overview and project health
- AI-style project understanding and capability signals
- Interactive architecture visualization
- Expandable file explorer with contextual explanations
- Beginner-friendly contribution discovery
- Implementation plan with exact files
- GitHub issue generation and copy-ready Markdown
- Selected-file automation scope with generated test plans and code-review findings
- Reliable, clearly labeled Demo Repository mode
- Global repository search and `Ctrl+K` / `Meta+K` command palette

## Demo mode

Click **Try Demo Repository** to run the entire experience without an API key. The seeded `open-source-labs/repolens` dataset includes:

- Repository overview and technologies
- Architecture graph nodes and edges
- File tree and file explanations
- Contribution recommendations
- Detailed implementation plan
- Generated GitHub issue preview
- Generated Vitest + React Testing Library starter tests
- Code-review findings with severity, file references and recommendations

Demo data is explicitly labeled `DEMO REPOSITORY` in the interface. The current app does not claim to have analyzed live GitHub data.

## Architecture

```text
GitHub URL
   ↓
Repository analyzer boundary
   ↓
Typed codebase representation
   ↓
Architecture + contextual AI analysis
   ↓
RepoLens dashboard
   ↓
Contribution plan → GitHub issue draft
```

The frontend keeps the mock implementation isolated behind `src/api/repository.ts`. These functions are the intended seam for connecting a real backend:

- `analyzeRepository(url)` → `POST /api/repositories/analyze`
- `getRepositoryStructure(id)`
- `getArchitecture(id)`
- `findContributions(id)` → `POST /api/contributions/find`
- `generateIssue(contribution)` → `POST /api/issues/generate`
- `generateTests(files)` → `POST /api/tests/generate`
- `reviewCode(files)` → `POST /api/reviews/code`

Keep GitHub tokens and AI keys server-side when these endpoints are implemented. The browser should only receive the typed response model.

## Development

Requirements: Node.js 20+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

The Vite server listens on `0.0.0.0:3000` for the managed preview. Useful scripts:

```bash
pnpm typecheck   # TypeScript validation
pnpm build       # Typecheck + production build
pnpm preview     # Serve the production build locally
```

## Environment variables

Copy `.env.example` when connecting a backend:

```bash
GITHUB_TOKEN=
AI_API_KEY=
BACKEND_URL=
```

The current demo does not require any of these values. Never commit real credentials or expose them in browser-bundled code.

## Project structure

```text
src/
  api/                  Mock API boundary and future backend seams
  components/           Architecture graph, command palette and file tree
  data/                 Seeded demo repository dataset
  types/                Shared repository and contribution types
  App.tsx               Product shell and workflow state
  index.css             RepoLens design system and responsive layout
```

## Open source

RepoLens is an original demo application scaffolded for this project. It uses the open-source React, Vite, Tailwind CSS, Lucide, Framer Motion and XYFlow packages listed in `package.json`; their respective licenses remain with those projects. See [`LICENSE`](./LICENSE) for the license for this application code.

## Demo note

`Open GitHub` is intentionally a non-destructive placeholder until GitHub OAuth and a server-side issue creation endpoint are connected. `Copy Issue` is fully functional and copies the generated Markdown to the clipboard.
