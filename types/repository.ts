export type ViewKey = 'analyze' | 'map' | 'contributions' | 'issues' | 'about'

export interface HealthStat {
  label: string
  value: string
  detail: string
  icon: string
  tone: string
}

export interface Technology {
  name: string
  kind?: string
  percentage?: number
  color?: string
  description?: string
}

export interface Capability {
  name: string
  summary: string
  icon: string
  status: string
}

export interface FileItem {
  id: string
  name: string
  path: string
  kind: 'file' | 'folder'
  language?: string
  purpose?: string
  importance?: string
  dependencies?: string[]
  relatedFiles?: string[]
  explanation?: string
  children?: FileItem[]
  extension?: string
  size?: number
}

export interface ArchitectureNode {
  id: string
  label: string
  subtitle: string
  category: string
  x: number
  y: number
  color: string
  purpose: string
  usedBy: string[]
  dependencies: string[]
}

export interface ArchitectureEdge {
  id: string
  from: string
  to: string
  label?: string
}

export interface Architecture {
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
}

export interface Contribution {
  id?: string
  title: string
  difficulty: string
  effort?: string
  impact?: string
  filesInvolved?: number
  risk?: string
  why?: string
  problem?: string
  whereToWork?: string[]
  implementationPlan?: string[]
  filesToModify?: string[]
  filesToUnderstand?: string[]
  files?: string[]
  reason?: string
  implementation_steps?: string[]
  acceptance_criteria?: string[]
}

export interface RepositoryAnalysis {
  id: string
  name: string
  owner: string
  fullName: string
  url: string
  description: string
  isDemo: boolean
  stars: string
  updated: string
  health: HealthStat[]
  technologies: Technology[]
  capabilities: Capability[]
  summary: string
  architecture: Architecture
  files: FileItem[]
  contributions: Contribution[]
}

export interface GeneratedTestPlan {
  title: string
  framework: string
  targetFiles: string[]
  testFile: string
  testCases: string[]
  code: string
  notes: string
}

export interface CodeReviewFinding {
  severity: string
  title: string
  description: string
  recommendation: string
  file: string
}

export interface CodeReviewResult {
  health: string
  reviewedFiles: string[]
  summary: string
  findings: CodeReviewFinding[]
}

export interface IssuePreview {
  title: string
  description: string
  proposedSolution: string
  implementation: string[]
  acceptanceCriteria: string[]
}
