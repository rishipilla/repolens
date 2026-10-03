# RepoLens Implementation Plan

## Goal and summary

Build the complete RepoLens React/TypeScript/Vite web application in the initialized managed Webdev project at `/home/ubuntu/repolens`. RepoLens will be a demo-first, production-style developer tool that turns a public GitHub repository URL into a codebase overview, interactive architecture map, file explorer, beginner contribution recommendation, implementation plan, and polished GitHub issue preview.

The application will be fully usable without API keys through a clearly labeled seeded demo repository. Real GitHub and AI services will be represented behind an isolated API/service boundary so the UI can later consume the documented backend contracts without moving mock data into components.

## Design direction

- **Design movement:** Dark developer tooling with a restrained Linear-meets-GitHub feel, but with RepoLens-specific repository “signal” motifs rather than a generic dashboard or chatbot.
- **Core principles:**
  1. Dense but calm information hierarchy: compact metadata, readable summaries, and purposeful whitespace.
  2. Evidence over decoration: architecture, files, dependencies and contribution rationale remain the visual focus.
  3. Contextual intelligence: AI actions open explanations in the relevant panel instead of a chat window.
  4. Demo reliability: every primary action has a deterministic response, clear status, and recoverable error state.
- **Color philosophy:** Use the requested near-black foundation (`#080B12`) for focus, layered navy surfaces for depth, cool borders for structure, and a distinctive violet RepoLens accent (`#7C5CFC`) for active analysis and primary actions. Green, amber and coral are reserved for semantic status so the interface stays professional.
- **Layout paradigm:** A persistent left rail establishes orientation, a wide analysis canvas carries the repository story, and contextual right-side drawers/panels reveal detail without navigating away. On mobile, the rail collapses into a compact top bar and contextual panels become bottom sheets or stacked sections.
- **Signature elements:**
  - A small “lens” mark made from nested brackets and a central dot in the wordmark.
  - Thin violet analysis rails and node connection lines that visually connect repository understanding to contribution work.
  - Compact “signal chips” for demo status, repository health and contribution risk.
- **Interaction philosophy:** Primary flows are short and explicit: analyze, inspect, find contribution, generate issue. Clickable nodes/files visibly highlight, panels preserve selection context, and keyboard shortcuts make high-frequency actions discoverable.
- **Animation:** Use short opacity/translate transitions for route sections and drawers, stagger the analysis pipeline, pulse only the active pipeline/node indicator, and animate graph focus lightly. Avoid continuous decorative motion or large glow effects.
- **Typography system:** Use a strong sans-serif UI face with a readable mono face for paths, code-like metadata and issue blocks. Headlines use tight tracking and 700 weight; body text stays at comfortable reading size; labels are uppercase only for compact status metadata.
- **Brand essence:** “A codebase field guide for developers making their first move.” Personality: **precise, encouraging, observant**.
- **Brand voice:** Headlines are direct and confidence-building; CTAs describe the next useful action. Example lines: “See the shape of the code before you change it.” and “Start with a contribution that fits the project.”
- **Wordmark/logo:** A custom-looking `[` lens mark with a central node followed by `RepoLens`, paired with the subtitle “Understand any codebase. Find where you can contribute.”
- **Signature brand color:** RepoLens Violet `#7C5CFC`, used as the recognizable active-state and analysis color, not as a full-page gradient.

## Key product behavior

1. **Landing / Analyze view**
   - Show the RepoLens wordmark, subtitle, navigation and a concise repository input hero.
   - Accept GitHub URLs, validate the URL shape, show a clear inline error for invalid input, and expose “Analyze Repository” and “Try Demo Repository”.
   - Keep the demo CTA always available and label resulting content as `DEMO REPOSITORY`.

2. **Analysis pipeline**
   - On valid analysis, transition through the six requested stages instead of a generic spinner.
   - Use a deterministic timed mock workflow, ensure it always completes, and provide a retry path for simulated failure states.
   - Load the repository dashboard after completion.

3. **Repository dashboard**
   - Render repository header, description, GitHub placeholder link, re-analyze action, demo badge, health cards, “What is this project?” summary and capability cards.
   - Centralize all repository information in the mock API/data modules.

4. **Interactive architecture**
   - Build a React Flow-style graph using a reasonable dependency such as `@xyflow/react` (or a lightweight comparable graph implementation if the package footprint is smaller).
   - Provide draggable nodes, zoom/pan, fit-to-screen, search/filter, highlighting, clickable node selection, and a detail drawer with purpose, usage and dependencies.
   - Keep graph readable at desktop widths and scroll/fit gracefully on tablet/mobile.

5. **File explorer**
   - Render an expandable repository tree from seed data.
   - Selecting a file opens its purpose, importance, dependencies, related files and AI explanation in a contextual detail area.
   - Add contextual “Explain this file” behavior with deterministic mock output.

6. **First contribution workflow**
   - Provide the prominent “Find my first contribution” section/button.
   - Show a short analysis state, then display the recommended beginner task, effort, impact, files, risk and rationale.
   - Make the recommendation open a detailed contribution view with problem, exact files, implementation steps, files to understand first, and a text difficulty label (no numeric scoring).

7. **GitHub issue generation**
   - Generate a polished issue preview from the selected contribution with title, description, proposed solution, implementation checklist and acceptance criteria.
   - Make Copy Issue write to the clipboard with a visible success state.
   - Make Open GitHub a clearly identified demo/placeholder action that does not claim to create a real issue.

8. **Search and command palette**
   - Implement repository-wide search over files/components/dependencies.
   - Bind `Ctrl+K` and `Meta+K` to a command palette with search, architecture, contribution, issue and repository explanation commands.
   - Commands should execute real UI actions and close the palette.

9. **States and resilience**
   - Implement polished empty, loading, success and error states for invalid URL, not found, private repository, analysis failure, AI failure, empty repository and network error.
   - Every visible button must either execute a working local action or be explicitly labeled as a demo/placeholder action.

## Implementation approach

- Use React + TypeScript + Vite, Tailwind CSS, Lucide icons, Framer Motion for restrained transitions, and a graph library for the architecture map.
- Create the app in a structured source tree rather than one oversized component.
- Keep mock data in `src/data/` and mock service functions in `src/api/`.
- Define shared domain types in `src/types/` so future backend responses can replace the mock implementation without rewriting presentational components.
- Use an application-level state model (React context or a small reducer) for selected repository, view/tab, selected architecture node, selected file, contribution state, issue state, command palette state and notifications.
- Keep navigation view-state driven if a full router is unnecessary; include a route manifest for the actual page route(s) required by Webdev.
- Avoid authentication, billing, accounts, database tables, or real external GitHub writes in this version.

## Planned project structure

```text
/home/ubuntu/repolens/
  app.config.ts                  # Project metadata including durable logoUrl literal
  package.json                   # Pinned dependencies and scripts
  vite.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  index.html
  public/
    manus-routes.json            # Static route manifest for the app
  src/
    main.tsx
    App.tsx                       # App shell and top-level state orchestration
    index.css                     # Theme tokens, typography, responsive rules
    types/
      repository.ts               # Repository, file, graph, contribution and issue types
    data/
      demoRepository.ts           # Complete seeded DEMO REPOSITORY dataset
    api/
      repository.ts               # analyzeRepository, getRepositoryStructure
      analysis.ts                 # getArchitecture and analysis-stage helpers
      contributions.ts            # findContributions
      issues.ts                   # generateIssue
      client.ts                   # Future backend base URL abstraction and safe fallback
    components/
      layout/
        AppShell.tsx
        Sidebar.tsx
        TopBar.tsx
        StatusStrip.tsx
      repository/
        LandingHero.tsx
        RepositoryHeader.tsx
        RepositoryStats.tsx
        ProjectUnderstanding.tsx
        TechnologyCard.tsx
      architecture/
        ArchitectureSection.tsx
        ArchitectureGraph.tsx
        ArchitectureNode.tsx
        NodeDetailsPanel.tsx
      files/
        FileExplorer.tsx
        FileTreeNode.tsx
        FileDetails.tsx
      contributions/
        ContributionSection.tsx
        ContributionCard.tsx
        ContributionDetails.tsx
        AnalysisProgress.tsx
      issues/
        IssuePreview.tsx
      command/
        CommandPalette.tsx
        SearchOverlay.tsx
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        EmptyState.tsx
        ErrorState.tsx
        Toast.tsx
        IconButton.tsx
        SectionHeading.tsx
    lib/
      utils.ts
      validation.ts
      clipboard.ts
  .env.example
  README.md
  LICENSE
```

## API/data contract

- `analyzeRepository(url)` returns a typed repository analysis object and currently selects the seeded dataset, preserving the entered URL in the header when the URL is valid.
- `getRepositoryStructure(id)` returns the typed file tree.
- `getArchitecture(id)` returns graph nodes and edges plus node metadata.
- `findContributions(id)` returns one or more typed contribution opportunities with the seeded recommendation first.
- `generateIssue(contribution)` returns a typed issue object.
- The mock layer will include comments at the integration points for:
  - `POST /api/repositories/analyze` with `{ url }`.
  - `POST /api/contributions/find`.
  - `POST /api/issues/generate`.
- No secrets are embedded in client code. `.env.example` will include `GITHUB_TOKEN=`, `AI_API_KEY=`, and `BACKEND_URL=` placeholders only.

## Verification plan

- Install dependencies and run the project’s typecheck/build scripts.
- Configure Webdev host-managed TypeScript diagnostics before the first code batch and resolve actionable diagnostics.
- Verify `GET /manus-routes.json` returns HTTP 200 and valid JSON matching the source route set.
- Start the Vite dev server on the configured Preview port and verify the Preview is reachable.
- Exercise the complete demo path: landing → Try Demo Repository → analysis stages → dashboard → architecture node selection/search/fit → file selection → contribution analysis/details → issue generation → copy action and clearly labeled Open GitHub placeholder.
- Exercise input validation and at least one recoverable error path so no loading state can remain stuck.
- Verify `Ctrl+K`/`Meta+K`, responsive layout at desktop/tablet/mobile widths, and no visible dead buttons.
- Inspect the implementation against the full requirements and fix any confirmed issues before checkpointing the project.

## Assumptions and open risks

- This version is intentionally demo-first because the supplied specification explicitly prioritizes a reliable hackathon demo and says real GitHub/AI integration can be connected later.
- “Open GitHub” will remain a non-destructive placeholder action until a backend/authenticated integration exists; the UI will state that clearly.
- A lightweight seeded architecture graph is sufficient for the demo as long as interactions (select, highlight, search, zoom/pan and fit) work and the graph reads as a real repository map.
- The managed Webdev project is already initialized at `/home/ubuntu/repolens`; implementation begins only after this plan is approved.
- No image generation is required because this is an internal developer-tool dashboard and the requested visual centerpiece is data/UI-driven rather than illustrative.
