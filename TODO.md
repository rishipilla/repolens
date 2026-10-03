# RepoLens Implementation Checklist

## Complete the demo-first repository analysis experience

- Build a React + TypeScript + Vite application with a dark developer-focused interface, subtle gradients, layered cards, thin borders, strong typography, responsive behavior, and original RepoLens branding.
- Show the RepoLens wordmark, subtitle `Understand any codebase. Find where you can contribute.`, and navigation entries for Analyze, Codebase Map, Contributions, Issues, and About.
- Provide a repository URL input with placeholder `Paste a GitHub repository URL...`, `Analyze Repository`, and `Try Demo Repository` actions.
- Validate GitHub URLs and show a clear inline invalid-URL error; do not leave the user in a stuck loading state.
- Provide a fully functional demo mode that works without any API key, uses a predefined seeded repository dataset, and clearly labels all seeded results `DEMO REPOSITORY` without pretending they came from a real analysis.

## Implement analysis and dashboard states

- When analyzing a repository, show an animated pipeline with the stages Repository detected, Reading project structure, Detecting technologies, Mapping dependencies, Understanding architecture, and Finding contribution opportunities.
- Ensure the pipeline completes deterministically and transitions into the repository dashboard.
- Include recoverable polished states for repository not found, private repository, analysis failure, AI failure, empty repository, network error, and invalid URL, with clear retry guidance.
- Render repository name, owner/repository, description, GitHub action, Re-analyze action, demo badge, and project health cards for Languages, Framework, Files, Dependencies, Tests, and Documentation.
- Render the `What is this project?` summary and capability cards for Authentication, API layer, Database, UI, and AI services.

## Implement the interactive architecture map

- Render a clickable architecture visualization with repository, frontend, API, database, framework and file/service nodes connected by readable edges.
- Support zoom, pan, fit-to-screen, search/filter, node highlighting, draggable nodes, and clickable node selection.
- Open a contextual side panel for a selected node containing purpose, used-by information, and dependencies.
- Keep the architecture visualization usable on smaller screens.

## Implement repository file exploration

- Render an expandable repository file tree from the dataset.
- Selecting a file must show purpose, importance, dependencies, related files, and an AI explanation.
- Provide a working contextual `Explain this file` action and do not implement a full IDE.

## Implement first contribution discovery

- Provide a prominent `Find my first contribution` section and working `Find a contribution` action.
- Show a short analysis animation and then render a recommendation with task name, Beginner difficulty, estimated effort, impact, files involved, risk, and rationale.
- Render contribution details including Problem, Where to work, exact files, Implementation plan, Files to modify, Files to understand first, and text difficulty labels Beginner, Intermediate, or Advanced without numerical scoring.
- Keep the contribution workflow usable from the command palette and relevant navigation controls.

## Implement GitHub issue generation

- Provide `Generate GitHub Issue` from the selected contribution.
- Render a polished issue preview with Title, Description, Proposed solution, Implementation checklist, and Acceptance criteria.
- Make `Copy Issue` copy the issue markdown to the clipboard and show a visible success state.
- Make `Open GitHub` a clearly labeled non-destructive demo/placeholder action until real GitHub integration exists.

## Implement contextual intelligence, search, and commands

- Add contextual actions `Explain this file`, `Why is this dependency important?`, `Find contribution`, `Generate issue`, and `Explain architecture` that render results in relevant panels rather than a generic chat window.
- Add global repository search with placeholder `Search files, components, dependencies...` and useful results for files/components/dependencies.
- Add a `Ctrl+K` and `Meta+K` command palette with Search repository, Open architecture, Find contribution, Generate issue, and Explain repository commands.
- Ensure each command executes a real UI action and closes the palette.

## Keep services and data ready for a real backend

- Put all mock data in an isolated demo data module rather than hardcoding it across UI components.
- Implement typed API abstractions for `analyzeRepository(url)`, `getRepositoryStructure(id)`, `getArchitecture(id)`, `findContributions(id)`, and `generateIssue(contribution)`.
- Document future backend contracts for `POST /api/repositories/analyze`, `POST /api/contributions/find`, and `POST /api/issues/generate`.
- Include comments at the real GitHub/AI integration points.
- Add `.env.example` with empty `GITHUB_TOKEN=`, `AI_API_KEY=`, and `BACKEND_URL=` placeholders; never include real credentials.

## Finish project documentation and delivery readiness

- Create a professional README covering the one-line description, problem, solution, feature list, architecture, development setup, environment variables, and open-source/license notes.
- Include an appropriate open-source LICENSE.
- Serve a valid `public/manus-routes.json` route manifest for the implemented page routes.
- Configure project metadata including a durable quoted `logoUrl` literal in `app.config.ts`.
- Run TypeScript diagnostics, build/typecheck checks, verify the Preview server, and inspect the complete demo path and responsive layout before delivery.
- Ensure every visible button works or clearly says it is a demo/placeholder action; do not ship lorem ipsum, broken buttons, or never-ending fake loading.

## Add automated tests and code review for selected repository files

- Allow one or more repository files to be added to an automation scope from the file detail panel.
- Generate a typed, reviewable test plan for the selected scope with framework, target files, test file path, test cases, starter code and implementation notes.
- Support component-oriented and non-component TypeScript test templates without claiming files were committed automatically.
- Review the selected scope with a summary, health status, severity-tagged findings, file references and concrete recommendations.
- Show loading, ready and recoverable error states for both automation actions.
- Keep the mock generators isolated behind `POST /api/tests/generate` and `POST /api/reviews/code` backend seams.
