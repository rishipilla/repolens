import type { Architecture, FileItem, RepositoryAnalysis } from './types/repository'

const architecture: Architecture = {
  nodes: [
    { id: 'repo', label: 'RepoLens', subtitle: 'Full-stack workspace', category: 'root', x: 430, y: 28, color: '#7C5CFC', purpose: 'A developer platform for navigating unfamiliar repositories and surfacing realistic first contributions.', usedBy: ['Workspace shell', 'Analysis pipeline'], dependencies: ['React', 'FastAPI', 'PostgreSQL'] },
    { id: 'frontend', label: 'Frontend', subtitle: 'React + Vite', category: 'layer', x: 96, y: 170, color: '#5BC0EB', purpose: 'The browser application that renders the dashboard, map and contribution experience.', usedBy: ['App shell', 'Repository dashboard'], dependencies: ['React', 'Tailwind CSS', 'React Flow'] },
    { id: 'api', label: 'API layer', subtitle: 'FastAPI services', category: 'layer', x: 430, y: 170, color: '#A78BFA', purpose: 'Typed REST endpoints that expose repository analysis, architecture and contribution workflows.', usedBy: ['Frontend data hooks', 'AI orchestration'], dependencies: ['FastAPI', 'Pydantic', 'httpx'] },
    { id: 'database', label: 'Database', subtitle: 'PostgreSQL', category: 'data', x: 766, y: 170, color: '#32D583', purpose: 'Stores repository snapshots, analysis metadata and contribution history for repeat visits.', usedBy: ['Repository service', 'Issue service'], dependencies: ['PostgreSQL', 'SQLAlchemy'] },
    { id: 'pages', label: 'Pages', subtitle: 'Dashboard views', category: 'module', x: 30, y: 338, color: '#60A5FA', purpose: 'Route-level composition for the overview, map, files and contribution views.', usedBy: ['Frontend'], dependencies: ['React Router', 'UI primitives'] },
    { id: 'components', label: 'Components', subtitle: 'Reusable UI', category: 'module', x: 224, y: 338, color: '#38BDF8', purpose: 'Reusable cards, panels and domain components that keep the UI consistent.', usedBy: ['Pages', 'Dashboard shell'], dependencies: ['Radix UI', 'Tailwind CSS'] },
    { id: 'services', label: 'Services', subtitle: 'Repository clients', category: 'module', x: 395, y: 338, color: '#8B5CF6', purpose: 'Client-side service boundaries for repository, contribution and issue requests.', usedBy: ['API layer', 'Pages'], dependencies: ['httpx', 'Pydantic schemas'] },
    { id: 'ai', label: 'AI analysis', subtitle: 'Context engine', category: 'module', x: 578, y: 338, color: '#F5B83D', purpose: 'Turns codebase signals into summaries, architecture explanations and contribution recommendations.', usedBy: ['API layer'], dependencies: ['LLM gateway', 'Prompt templates'] },
    { id: 'auth', label: 'Auth', subtitle: 'Session context', category: 'module', x: 786, y: 338, color: '#FB7185', purpose: 'Keeps analysis context scoped to the current workspace and repository.', usedBy: ['Frontend', 'API layer'], dependencies: ['Session middleware'] },
    { id: 'usercard', label: 'UserCard.tsx', subtitle: 'Example target', category: 'file', x: 156, y: 498, color: '#D4A4FF', purpose: 'A profile card that currently renders no feedback while user data is loading.', usedBy: ['Dashboard page', 'Team members list'], dependencies: ['useUser()', 'Avatar', 'Skeleton'] },
    { id: 'routes', label: 'routes.py', subtitle: 'REST surface', category: 'file', x: 438, y: 498, color: '#C4B5FD', purpose: 'Declares API endpoints and delegates repository analysis to domain services.', usedBy: ['API layer'], dependencies: ['analysis_service', 'Pydantic'] },
    { id: 'models', label: 'models.py', subtitle: 'Data models', category: 'file', x: 744, y: 498, color: '#86EFAC', purpose: 'Defines persisted repository and contribution records for the database layer.', usedBy: ['Database', 'Repository service'], dependencies: ['SQLAlchemy'] },
  ],
  edges: [
    { id: 'e1', from: 'repo', to: 'frontend', label: 'renders' },
    { id: 'e2', from: 'repo', to: 'api', label: 'connects' },
    { id: 'e3', from: 'repo', to: 'database', label: 'persists' },
    { id: 'e4', from: 'frontend', to: 'pages' },
    { id: 'e5', from: 'frontend', to: 'components' },
    { id: 'e6', from: 'api', to: 'services' },
    { id: 'e7', from: 'api', to: 'ai' },
    { id: 'e8', from: 'api', to: 'auth' },
    { id: 'e9', from: 'database', to: 'models' },
    { id: 'e10', from: 'components', to: 'usercard' },
    { id: 'e11', from: 'services', to: 'routes' },
    { id: 'e12', from: 'models', to: 'routes', label: 'schema' },
    { id: 'e13', from: 'ai', to: 'routes', label: 'recommends' },
  ],
}

const files: FileItem[] = [
  {
    id: 'src', name: 'src', path: 'src', kind: 'folder', purpose: 'Application source organized by domain and layer.', children: [
      {
        id: 'components', name: 'components', path: 'src/components', kind: 'folder', purpose: 'Reusable UI components shared across the product.', children: [
          { id: 'user-card', name: 'UserCard.tsx', path: 'src/components/UserCard.tsx', kind: 'file', language: 'TSX', purpose: 'Renders a user profile summary inside the dashboard.', importance: 'High — this is a shared surface used by the dashboard and team views.', dependencies: ['useUser()', 'Avatar', 'Skeleton'], relatedFiles: ['src/hooks/useUser.ts', 'src/components/Skeleton.tsx'], explanation: 'UserCard already follows the card composition pattern. It needs a loading branch before it reads the user object so slow network responses do not leave an empty shell.' },
          { id: 'navbar', name: 'Navbar.tsx', path: 'src/components/Navbar.tsx', kind: 'file', language: 'TSX', purpose: 'Primary navigation for workspace-level views.', importance: 'Medium — shared on every authenticated route.', dependencies: ['NavLink', 'WorkspaceContext'], relatedFiles: ['src/App.tsx', 'src/layouts/AppLayout.tsx'], explanation: 'Navbar maps the route model into compact navigation items and owns the active route underline.' },
          { id: 'skeleton', name: 'Skeleton.tsx', path: 'src/components/Skeleton.tsx', kind: 'file', language: 'TSX', purpose: 'Provides a neutral loading placeholder for cards and lists.', importance: 'High — reusable loading pattern already used by the dashboard.', dependencies: ['cn()', 'Tailwind CSS'], relatedFiles: ['src/components/UserCard.tsx'], explanation: 'Skeleton is intentionally small and composable. Reusing it keeps the loading state visually consistent with other surfaces.' },
        ],
      },
      {
        id: 'pages', name: 'pages', path: 'src/pages', kind: 'folder', purpose: 'Route-level screens.', children: [
          { id: 'dashboard', name: 'Dashboard.tsx', path: 'src/pages/Dashboard.tsx', kind: 'file', language: 'TSX', purpose: 'Composes project health, activity and contribution surfaces.', importance: 'High — main user destination after authentication.', dependencies: ['UserCard', 'ProjectHealth', 'useRepository'], relatedFiles: ['src/components/UserCard.tsx', 'src/hooks/useRepository.ts'], explanation: 'Dashboard is mostly composition; its nested cards own their specific data and loading states.' },
          { id: 'repository', name: 'Repository.tsx', path: 'src/pages/Repository.tsx', kind: 'file', language: 'TSX', purpose: 'Repository analysis workspace.', importance: 'High — the codebase understanding workflow starts here.', dependencies: ['ArchitectureMap', 'FileExplorer', 'ContributionPanel'], relatedFiles: ['src/components/ArchitectureMap.tsx', 'src/services/repository.ts'], explanation: 'Repository is the coordinating page for codebase evidence. It is the best place to trace how the graph, file tree and contribution panels share context.' },
        ],
      },
      {
        id: 'hooks', name: 'hooks', path: 'src/hooks', kind: 'folder', purpose: 'Data and interaction hooks.', children: [
          { id: 'use-user', name: 'useUser.ts', path: 'src/hooks/useUser.ts', kind: 'file', language: 'TS', purpose: 'Fetches the current user and exposes loading/error state.', importance: 'High — source of truth for UserCard data.', dependencies: ['apiClient', 'User type'], relatedFiles: ['src/components/UserCard.tsx', 'src/providers/SessionProvider.tsx'], explanation: 'The hook returns `{ data, isLoading, error }`. The recommended contribution is intentionally small because the loading signal already exists.' },
        ],
      },
      { id: 'app', name: 'App.tsx', path: 'src/App.tsx', kind: 'file', language: 'TSX', purpose: 'Bootstraps route providers and the application shell.', importance: 'High — root composition point.', dependencies: ['Router', 'SessionProvider', 'AppLayout'], relatedFiles: ['src/layouts/AppLayout.tsx', 'src/pages/Dashboard.tsx'], explanation: 'App establishes the provider tree; changes here should stay rare and focused on application-wide wiring.' },
      { id: 'api', name: 'api.ts', path: 'src/api.ts', kind: 'file', language: 'TS', purpose: 'Configures the typed API client and shared request helpers.', importance: 'High — cross-cutting data boundary.', dependencies: ['fetch', 'BACKEND_URL'], relatedFiles: ['src/hooks/useUser.ts', 'src/services/repository.ts'], explanation: 'The API client centralizes base URL, headers and error normalization so feature modules do not duplicate network logic.' },
    ],
  },
  { id: 'readme', name: 'README.md', path: 'README.md', kind: 'file', language: 'MD', purpose: 'Project orientation and local development guide.', importance: 'Medium — first stop for new contributors.', dependencies: ['Markdown'], relatedFiles: ['CONTRIBUTING.md'], explanation: 'README describes the project shape and points to local setup; it is a good place for future beginner-friendly documentation improvements.' },
  { id: 'package', name: 'package.json', path: 'package.json', kind: 'file', language: 'JSON', purpose: 'Declares scripts and dependency boundaries.', importance: 'High — defines the build and test toolchain.', dependencies: ['npm/pnpm'], relatedFiles: ['package-lock.json', 'vite.config.ts'], explanation: 'Package scripts reveal the project’s expected local workflow and should be checked before changing tooling.' },
]

export const demoRepository: RepositoryAnalysis = {
  id: 'demo-repolens',
  name: 'RepoLens',
  owner: 'open-source-labs',
  fullName: 'open-source-labs/repolens',
  url: 'https://github.com/open-source-labs/repolens',
  description: 'An AI-powered codebase navigator that turns repository signals into a clear first contribution.',
  isDemo: true,
  stars: '2.8k',
  updated: 'Updated 2 days ago',
  health: [
    { label: 'Languages', value: '4', detail: 'TypeScript leads at 62%', icon: 'code', tone: 'violet' },
    { label: 'Framework', value: 'React', detail: 'Vite + FastAPI', icon: 'layers', tone: 'blue' },
    { label: 'Files', value: '184', detail: 'Across 12 packages', icon: 'file', tone: 'mint' },
    { label: 'Dependencies', value: '47', detail: '6 need updates', icon: 'box', tone: 'amber' },
    { label: 'Tests', value: '86%', detail: 'Coverage on core', icon: 'check', tone: 'mint' },
    { label: 'Docs', value: 'Good', detail: 'README + guides', icon: 'book', tone: 'coral' },
  ],
  technologies: [
    { name: 'TypeScript', kind: 'Language', percentage: 62, color: '#7C5CFC', description: 'Typed UI, hooks and service boundaries.' },
    { name: 'Python', kind: 'Language', percentage: 24, color: '#5BC0EB', description: 'API and analysis orchestration.' },
    { name: 'CSS', kind: 'Language', percentage: 9, color: '#32D583', description: 'Design tokens and responsive layout.' },
    { name: 'Other', kind: 'Config + docs', percentage: 5, color: '#F5B83D', description: 'Markdown, JSON and shell scripts.' },
  ],
  capabilities: [
    { name: 'Authentication', summary: 'Session context scopes workspace analysis.', icon: 'shield', status: 'mapped' },
    { name: 'API layer', summary: 'FastAPI endpoints expose typed repository workflows.', icon: 'braces', status: 'mapped' },
    { name: 'Database', summary: 'PostgreSQL stores snapshots and contribution history.', icon: 'database', status: 'mapped' },
    { name: 'UI', summary: 'React views compose cards, maps and file details.', icon: 'layout', status: 'mapped' },
    { name: 'AI services', summary: 'Context engine summarizes signals and recommends work.', icon: 'sparkles', status: 'inferred' },
  ],
  summary: 'This is a full-stack developer platform built with React and FastAPI. The frontend communicates with typed REST APIs while PostgreSQL stores repository snapshots and contribution history. An AI context engine sits between raw codebase signals and the contributor-facing explanation layer.',
  architecture,
  files,
  contributions: [
    {
      id: 'loading-user-card',
      title: 'Add loading state to UserCard',
      difficulty: 'Beginner',
      effort: '20–30 minutes',
      impact: 'Medium',
      filesInvolved: 3,
      risk: 'Low',
      why: 'This task is isolated from the backend and follows existing component patterns. The loading signal already exists in useUser(), so it is a safe first change for someone unfamiliar with the project.',
      problem: 'UserCard reads user data immediately and leaves an empty card-shaped gap while the network request is still in flight. That makes the dashboard feel unresponsive and creates an inconsistent loading experience next to the other cards.',
      whereToWork: ['src/components/UserCard.tsx', 'src/hooks/useUser.ts', 'src/components/Skeleton.tsx'],
      implementationPlan: ['Add a loading branch to UserCard before reading user fields.', 'Read the existing isLoading signal from useUser().', 'Compose the shared Skeleton component to match neighboring cards.', 'Replace the empty gap with a calm placeholder layout.', 'Add a focused component test for the loading state.'],
      filesToModify: ['src/components/UserCard.tsx', 'src/components/UserCard.test.tsx'],
      filesToUnderstand: ['src/hooks/useUser.ts', 'src/components/Skeleton.tsx', 'src/pages/Dashboard.tsx'],
    },
    {
      id: 'readme-setup',
      title: 'Clarify local setup prerequisites',
      difficulty: 'Beginner',
      effort: '30–45 minutes',
      impact: 'Low',
      filesInvolved: 2,
      risk: 'Low',
      why: 'The project already has a README structure; the missing piece is a concise prerequisites section for new contributors.',
      problem: 'New contributors need to infer the required Node and Python versions from the package scripts.',
      whereToWork: ['README.md', 'docs/development.md'],
      implementationPlan: ['List supported runtimes.', 'Document install commands.', 'Add a verify step.', 'Link to the contribution guide.'],
      filesToModify: ['README.md'],
      filesToUnderstand: ['package.json', 'CONTRIBUTING.md'],
    },
  ],
}

export function flattenFiles(items: FileItem[]): FileItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenFiles(item.children) : [])])
}
