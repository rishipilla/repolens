import { demoRepository, flattenFiles } from './demoRepository'
import type { Architecture, CodeReviewResult, Contribution, FileItem, GeneratedTestPlan, IssuePreview, RepositoryAnalysis } from './types/repository'

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
const BACKEND_URL = 'http://127.0.0.1:8000'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function backendRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = 'RepoLens could not reach the backend. Check that the FastAPI server is running on port 8000.'
    try {
      const payload = await response.json() as { detail?: string; error?: string }
      if (payload.detail) message = payload.detail
      else if (payload.error) message = payload.error
    } catch {
      // Ignore JSON parse failures and keep the generic message.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function analyzeRepository(url: string): Promise<RepositoryAnalysis> {
  const result = await backendRequest<RepositoryAnalysis>('/api/repositories/analyze', { url })
  return { ...clone(result), isDemo: false }
}

export async function getDemoRepository(): Promise<RepositoryAnalysis> {
  await wait(220)
  return clone(demoRepository)
}

export async function getRepositoryStructure(_id: string): Promise<FileItem[]> {
  const demoTree = clone(demoRepository.files)
  return demoTree
}

export async function getArchitecture(_id: string): Promise<Architecture> {
  return clone(demoRepository.architecture)
}

export async function findContributions(id: string): Promise<Contribution[]> {
  if (!id || id === 'demo-repolens' || !id.includes('/')) {
    await wait(220)
    return clone(demoRepository.contributions)
  }

  const result = await backendRequest<Contribution[]>('/api/contributions/find', {
    repository_url: id.startsWith('http') ? id : `https://github.com/${id}`,
    analysis: { fullName: id, description: 'Repository contribution analysis request.' },
  })
  return result
}

export async function generateIssue(contribution: Contribution): Promise<IssuePreview> {
  const fallbackIssue: IssuePreview = {
    title: contribution.title,
    description: contribution.problem ?? 'The repository needs a clear contributor-facing change with a safe scope and implementation guidance.',
    proposedSolution: contribution.why ?? 'Keep the change focused and validate it against the repository’s real entry points and patterns.',
    implementation: contribution.implementationPlan ?? contribution.implementation_steps ?? ['Review the relevant files', 'Implement the focused change', 'Validate the expected behavior'],
    acceptanceCriteria: contribution.acceptance_criteria ?? ['The change respects the repository’s current patterns', 'The update is scoped to the relevant files', 'The affected behavior is validated'],
  }

  try {
    return await backendRequest<IssuePreview>('/api/issues/generate', { contribution })
  } catch {
    return fallbackIssue
  }
}

export async function generateTests(files: FileItem[]): Promise<GeneratedTestPlan> {
  await wait(720)
  const targetFiles = files.map((file) => file.path)
  const primaryFile = files[0]
  const componentName = primaryFile?.name?.replace(/\.[^.]+$/, '') || 'SelectedComponent'
  const isComponent = primaryFile?.language === 'TSX' || primaryFile?.language === 'JSX'
  const importStatement = isComponent ? (componentName === 'App' ? `import App from './${componentName}'` : `import { ${componentName} } from './${componentName}'`) : `import * as subjectUnderTest from './${componentName}'`
  const testFile = primaryFile?.path.replace(/\.(tsx?|jsx?)$/, '.test.$1') ?? 'src/generated/repository.test.tsx'
  return {
    title: `Test plan for ${primaryFile?.name ?? 'selected repository files'}`,
    framework: isComponent ? 'Vitest + React Testing Library' : 'Vitest',
    targetFiles,
    testFile,
    testCases: ['renders the default state with the expected primary content', 'shows a loading state while the data dependency is pending', 'handles the empty or error state without crashing', 'keeps the existing interaction contract unchanged'],
    code: isComponent ? `import { render, screen } from '@testing-library/react'\nimport { describe, expect, it } from 'vitest'\n${importStatement}\n\ndescribe('${primaryFile?.name ?? 'selected file'}', () => {\n  it('renders the primary content', () => {\n    render(<${componentName} />)\n    expect(screen.getByRole('main')).toBeInTheDocument()\n  })\n\n  it('exposes a stable loading state', () => {\n    // Arrange the pending dependency, then assert the shared Skeleton appears.\n    expect(true).toBe(true)\n  })\n})` : `import { describe, expect, it } from 'vitest'\n${importStatement}\n\ndescribe('${primaryFile?.name ?? 'selected file'}', () => {\n  it('exposes the selected module', () => {\n    expect(subjectUnderTest).toBeDefined()\n  })\n\n  it('keeps the public contract stable', () => {\n    // Add focused cases for the exported functions and error paths here.\n    expect(Object.keys(subjectUnderTest).length).toBeGreaterThan(0)\n  })\n})`,
    notes: 'The generated file is a reviewable starting point. Confirm the component export, provider setup and existing test helpers before committing.',
  }
}

export async function reviewCode(files: FileItem[]): Promise<CodeReviewResult> {
  await wait(760)
  const reviewedFiles = files.map((file) => file.path)
  const hasUserCard = files.some((file) => file.name === 'UserCard.tsx')
  return {
    health: hasUserCard ? 'Needs attention' : 'Looks good',
    reviewedFiles,
    summary: hasUserCard ? 'The selected UI surface follows the project’s component patterns, but its async state boundary needs an explicit loading branch before it reads user data.' : 'The selected files fit the repository’s existing layering and naming conventions. No blocking issue was found in this demo review.',
    findings: hasUserCard ? [
      { severity: 'medium', title: 'Loading state is implicit', description: 'The component can render an empty shell while useUser() is still pending.', recommendation: 'Branch on isLoading before reading user fields and reuse the shared Skeleton component.', file: 'src/components/UserCard.tsx' },
      { severity: 'low', title: 'Add a focused regression test', description: 'The async state contract is not protected by a component-level test.', recommendation: 'Cover pending, resolved and error states with the existing Vitest helpers.', file: 'src/components/UserCard.test.tsx' },
      { severity: 'positive', title: 'Good dependency boundary', description: 'Data fetching remains in useUser() instead of leaking request details into the presentational card.', recommendation: 'Keep the hook as the source of truth while adding the visual state branch.', file: 'src/hooks/useUser.ts' },
    ] : [{ severity: 'positive', title: 'Consistent project patterns', description: 'The selected files use the repository’s established naming and module boundaries.', recommendation: 'Keep the change focused and add a regression test alongside the modified file.', file: reviewedFiles[0] ?? 'Selected files' }],
  }
}

export function searchRepository(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []
  return flattenFiles(demoRepository.files)
    .filter((item) => item.kind === 'file')
    .filter((item) => [item.name, item.path, item.purpose, ...(item.dependencies ?? [])].join(' ').toLowerCase().includes(normalized))
    .slice(0, 8)
    .map((item) => ({ id: item.id, title: item.name, type: item.language === 'TSX' ? 'Component' : item.kind === 'file' ? 'File' : 'Folder', path: item.path, description: item.purpose ?? '' }))
}
