import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Box,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Code2,
  Command,
  Database,
  ExternalLink,
  FileCode2,
  FileText,
  GitBranch,
  Github,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Loader2,
  Map,
  Menu,
  MessageSquareText,
  Network,
  PanelRight,
  Play,
  Search,
  Server,
  Settings2,
  Shield,
  Sparkles,
  Terminal,
  UserRound,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'
import { ArchitectureGraph } from './components/ArchitectureGraph'
import { CommandPalette, type PaletteAction } from './components/CommandPalette'
import { FileTree } from './components/FileTree'
import { analyzeRepository, findContributions, generateIssue, generateTests, getArchitecture, getDemoRepository, reviewCode, searchRepository } from './api/repository'
import { flattenFiles } from './data/demoRepository'
import type { ArchitectureNode, CodeReviewResult, Contribution, FileItem, GeneratedTestPlan, IssuePreview, RepositoryAnalysis, ViewKey } from './types/repository'

const pipelineStages = [
  { label: 'Repository detected', detail: 'URL looks like a public GitHub repository', icon: GitBranch },
  { label: 'Reading project structure', detail: 'Indexing source folders and entry points', icon: FileCode2 },
  { label: 'Detecting technologies', detail: 'Recognizing languages, frameworks and services', icon: Layers3 },
  { label: 'Mapping architecture', detail: 'Tracing how the major layers connect', icon: Network },
  { label: 'Finding contribution opportunities', detail: 'Ranking realistic first steps', icon: WandSparkles },
]

const navItems: Array<{ id: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'analyze', label: 'Analyze', icon: LayoutDashboard },
  { id: 'map', label: 'Codebase Map', icon: Network },
  { id: 'contributions', label: 'Contributions', icon: WandSparkles },
  { id: 'issues', label: 'Issues', icon: MessageSquareText },
  { id: 'about', label: 'About', icon: Lightbulb },
]

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

function isGithubUrl(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2
  } catch {
    return false
  }
}

const analysisFixtures = [
  { marker: '/private', message: 'This repository appears to be private. RepoLens can only read public repositories in demo mode.' },
  { marker: '/not-found', message: 'GitHub could not find that repository. Check the owner and repository name, then try again.' },
  { marker: '/empty', message: 'This repository does not contain enough readable source files to build a useful map.' },
  { marker: '/network', message: 'GitHub is unreachable right now. Check your connection and try again.' },
]

function iconForStat(icon: string) {
  const icons: Record<string, typeof Code2> = { code: Code2, layers: Layers3, file: FileText, box: Box, check: CheckCircle2, book: BookOpen }
  return icons[icon] ?? Activity
}

function iconForCapability(icon: string) {
  const icons: Record<string, typeof Code2> = { shield: Shield, braces: Braces, database: Database, layout: LayoutDashboard, sparkles: Sparkles }
  return icons[icon] ?? Sparkles
}

function issueMarkdown(issue: IssuePreview) {
  return `# ${issue.title}\n\n## Description\n${issue.description}\n\n## Proposed solution\n${issue.proposedSolution}\n\n## Implementation\n${issue.implementation.map((item) => `- ${item}`).join('\n')}\n\n## Acceptance criteria\n${issue.acceptanceCriteria.map((item) => `- ${item}`).join('\n')}`
}

function App() {
  const [repo, setRepo] = useState<RepositoryAnalysis | null>(null)
  const [input, setInput] = useState('')
  const [activeView, setActiveView] = useState<ViewKey>('analyze')
  const [analysisState, setAnalysisState] = useState<'idle' | 'running' | 'ready' | 'error'>('idle')
  const [pipelineIndex, setPipelineIndex] = useState(-1)
  const [analysisError, setAnalysisError] = useState('')
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null)
  const [architectureQuery, setArchitectureQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [automationScope, setAutomationScope] = useState<FileItem[]>([])
  const [automationTab, setAutomationTab] = useState<'tests' | 'review' | null>(null)
  const [automationState, setAutomationState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [generatedTests, setGeneratedTests] = useState<GeneratedTestPlan | null>(null)
  const [codeReview, setCodeReview] = useState<CodeReviewResult | null>(null)
  const [fileQuery, setFileQuery] = useState('')
  const [findState, setFindState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null)
  const [issueState, setIssueState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [issue, setIssue] = useState<IssuePreview | null>(null)
  const [copied, setCopied] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [insight, setInsight] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const allFiles = useMemo(() => repo ? flattenFiles(repo.files).filter((item) => item.kind === 'file') : [], [repo])
  const searchResults = useMemo(() => searchRepository(fileQuery), [fileQuery])
  const automationFiles = useMemo(() => automationScope.length ? automationScope : selectedFile ? [selectedFile] : [], [automationScope, selectedFile])

  const runAnalysis = useCallback(async (url?: string, demo = false) => {
    setAnalysisError('')
    setAnalysisState('running')
    setActiveView('analyze')
    setPipelineIndex(0)
    setSelectedNode(null)
    setSelectedFile(null)
    setFindState('idle')
    setIssueState('idle')
    for (let index = 1; index < pipelineStages.length; index += 1) {
      await pause(430)
      setPipelineIndex(index)
    }
    try {
      const result = demo ? await getDemoRepository() : await analyzeRepository(url ?? input.trim())
      setRepo(result)
      setAnalysisState('ready')
      setPipelineIndex(pipelineStages.length)
      setSelectedContribution(result.contributions[0])
      setContributions(result.contributions)
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'The analysis failed while mapping dependencies. Check that GitHub is reachable and try again.'
      setAnalysisState('error')
      setAnalysisError(message)
    }
  }, [input])

  const handleAnalyze = () => {
    const value = input.trim()
    if (!isGithubUrl(value)) {
      setAnalysisError('Enter a public GitHub URL, for example https://github.com/open-source-labs/repolens')
      setAnalysisState('error')
      return
    }
    const fixture = analysisFixtures.find((candidate) => value.toLowerCase().includes(candidate.marker))
    if (fixture) {
      setAnalysisError(fixture.message)
      setAnalysisState('error')
      return
    }
    void runAnalysis(value)
  }

  const handleDemo = () => {
    setInput('https://github.com/open-source-labs/repolens')
    void runAnalysis(undefined, true)
  }

  const handleFindContribution = useCallback(async () => {
    if (!repo) return
    setActiveView('contributions')
    setFindState('loading')
    setInsight('')
    try {
      const result = await findContributions(repo.id)
      setContributions(result)
      setSelectedContribution(result[0])
      setFindState('ready')
    } catch {
      setFindState('error')
    }
  }, [repo])

  const handleGenerateIssue = useCallback(async () => {
    if (!selectedContribution) return
    setActiveView('issues')
    setIssueState('loading')
    try {
      const result = await generateIssue(selectedContribution)
      setIssue(result)
      setIssueState('ready')
    } catch {
      setIssueState('error')
    }
  }, [selectedContribution])

  const handlePaletteAction = useCallback((action: PaletteAction) => {
    if (action === 'search') { setSearchOpen(true); return }
    if (action === 'map') { setActiveView('map'); return }
    if (action === 'contribution') { void handleFindContribution(); return }
    if (action === 'issue') { void handleGenerateIssue(); return }
    setActiveView('analyze')
    setInsight('The repository is a React + FastAPI developer platform with typed service boundaries, a PostgreSQL persistence layer and an AI context engine that turns signals into contributor guidance.')
  }, [handleFindContribution, handleGenerateIssue])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selectNav = (view: ViewKey) => {
    setActiveView(view)
    setMobileNav(false)
    if (view === 'contributions' && repo && findState === 'idle') void handleFindContribution()
    if (view === 'issues' && selectedContribution && issueState === 'idle') void handleGenerateIssue()
  }

  const selectedFileFromSearch = (id: string) => {
    const found = allFiles.find((item) => item.id === id)
    if (found) { setSelectedFile(found); setActiveView('analyze'); setSearchOpen(false) }
  }

  const toggleAutomationFile = (file: FileItem) => {
    setAutomationScope((current) => current.some((item) => item.id === file.id) ? current.filter((item) => item.id !== file.id) : [...current, file])
  }

  const runAutomation = async (tab: 'tests' | 'review') => {
    if (!automationFiles.length) return
    setAutomationTab(tab)
    setAutomationState('loading')
    try {
      if (tab === 'tests') setGeneratedTests(await generateTests(automationFiles))
      else setCodeReview(await reviewCode(automationFiles))
      setAutomationState('ready')
    } catch {
      setAutomationState('error')
    }
  }

  const copyIssue = async () => {
    if (!issue) return
    let copiedSuccessfully = false
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(issueMarkdown(issue))
        copiedSuccessfully = true
      }
    } catch { /* Clipboard may be unavailable in a sandboxed preview. */ }
    setCopied(copiedSuccessfully)
    if (copiedSuccessfully) window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>[</span><i /><span>]</span></div>
          <div><strong>RepoLens</strong><small>CODEBASE NAVIGATOR</small></div>
        </div>
        <button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        <div className="sidebar-label">Workspace</div>
        <nav className="main-nav">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeView === id ? 'is-active' : ''}`} onClick={() => selectNav(id)}><Icon size={17} /><span>{label}</span>{id === 'contributions' && selectedContribution && <span className="nav-count">1</span>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-card">
          <div className="sidebar-card-icon"><Zap size={15} /></div>
          <strong>Start with signal</strong>
          <p>Map the shape of a repository before changing it.</p>
          <button onClick={repo ? () => selectNav('map') : handleDemo}>Explore the demo <ArrowUpRight size={14} /></button>
        </div>
        <div className="sidebar-footer"><span className="online-dot" /> Demo engine ready <span className="version">v0.9</span></div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>{repo ? repo.name : 'Analyze'}</strong>{repo?.isDemo && <span className="demo-chip">DEMO REPOSITORY</span>}</div>
          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => setSearchOpen(true)}><Search size={15} /><span>Search repository</span><kbd>Ctrl K</kbd></button>
            <button className="icon-button" onClick={() => setPaletteOpen(true)} aria-label="Open command palette"><Command size={17} /></button>
            <div className="avatar"><UserRound size={15} /></div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {analysisState === 'running' && <motion.div key="pipeline" className="pipeline-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pipeline-shell">
              <div className="eyebrow"><span className="pulse-dot" /> ANALYSIS IN PROGRESS</div>
              <h1>Reading the shape of your repository.</h1>
              <p className="lead">RepoLens is building a navigable mental model from structure, dependencies and conventions.</p>
              <div className="pipeline-list">
                {pipelineStages.map((stage, index) => { const Icon = stage.icon; const complete = index < pipelineIndex; const active = index === pipelineIndex; return <div className={`pipeline-row ${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''}`} key={stage.label}><span className="pipeline-status">{complete ? <Check size={14} /> : active ? <Loader2 size={14} className="spin" /> : <span />}</span><span className="pipeline-icon"><Icon size={16} /></span><span className="pipeline-copy"><strong>{stage.label}</strong><small>{stage.detail}</small></span>{active && <span className="stage-now">NOW</span>}</div> })}
              </div>
              <div className="pipeline-foot"><span className="progress-line"><i style={{ width: `${Math.max(8, (Math.max(pipelineIndex, 0) / pipelineStages.length) * 100)}%` }} /></span><span>{Math.min(pipelineIndex + 1, pipelineStages.length)} / {pipelineStages.length} stages</span></div>
            </div>
          </motion.div>}

          {analysisState === 'idle' && !repo && <motion.div key="landing" className="landing-screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="landing-grid" />
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> CODEBASE INTELLIGENCE <span className="eyebrow-line" /></div>
              <h1>Understand a repository<br /><span>before you touch the code.</span></h1>
              <p>RepoLens maps unfamiliar projects into architecture, file context and a first contribution you can actually ship.</p>
              <div className="repo-input-wrap">
                <div className="repo-input-row"><Github size={19} /><input value={input} onChange={(event) => { setInput(event.target.value); setAnalysisError('') }} onKeyDown={(event) => { if (event.key === 'Enter') handleAnalyze() }} placeholder="Paste a GitHub repository URL..." /><button onClick={handleAnalyze}><span>Analyze Repository</span><ArrowUpRight size={16} /></button></div>
                {analysisError && <div className="input-error"><AlertCircle size={14} />{analysisError}<button onClick={handleDemo}>Try the demo instead</button></div>}
              </div>
              <div className="hero-actions"><button className="secondary-button" onClick={handleDemo}><Play size={15} fill="currentColor" /> Try Demo Repository</button><span className="hero-note"><Shield size={13} /> No API key required</span></div>
            </div>
            <div className="hero-signal-card">
              <div className="signal-card-top"><span><span className="live-dot" /> LIVE PREVIEW</span><span>01 / 04</span></div>
              <div className="signal-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><div className="brand-mark small"><span>[</span><i /><span>]</span></div></div><div className="orbit-node node-a"><Code2 size={14} /></div><div className="orbit-node node-b"><Database size={14} /></div><div className="orbit-node node-c"><Sparkles size={14} /></div></div>
              <div className="signal-card-footer"><div><span className="mini-label">Signal</span><strong>Structure → context → action</strong></div><ArrowUpRight size={18} /></div>
            </div>
            <div className="landing-footer"><span>Built for the first hour of understanding</span><span>React <i /> FastAPI <i /> PostgreSQL <i /> AI context</span></div>
          </motion.div>}

          {analysisState === 'error' && !repo && <motion.div key="error" className="error-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="error-card"><div className="error-symbol"><AlertCircle size={25} /></div><div><div className="eyebrow">ANALYSIS NEEDS A SECOND LOOK</div><h2>We couldn’t analyze this repository.</h2><p>{analysisError || 'Check that the URL is correct, the repository is public and GitHub is reachable.'}</p><div className="error-checks"><span><Check size={13} /> URL is a public GitHub repository</span><span><Check size={13} /> GitHub is reachable</span><span><Check size={13} /> Repository has readable source files</span></div><button className="primary-button" onClick={() => { setAnalysisState('idle'); setAnalysisError('') }}>Try again <ArrowUpRight size={15} /></button></div></div></motion.div>}

          {repo && analysisState !== 'running' && <motion.div key="dashboard" className="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="dashboard-header">
              <div><div className="eyebrow"><span className="eyebrow-line" /> REPOSITORY OVERVIEW {repo.isDemo ? <span className="demo-chip">DEMO REPOSITORY</span> : <span className="mock-chip">MOCK PREVIEW</span>}</div><h1>{repo.name}</h1><div className="repo-meta"><span className="mono">{repo.owner} / {repo.name}</span><span className="dot-sep" /><span>{repo.stars} stars</span><span className="dot-sep" /><span>{repo.updated}</span></div><p>{repo.description}</p></div>
              <div className="header-actions"><button className="ghost-button" onClick={() => window.open(repo.url, '_blank', 'noopener,noreferrer')}><Github size={15} /> View on GitHub <ExternalLink size={12} /></button><button className="secondary-button compact" onClick={() => { setRepo(null); setAnalysisState('idle'); setInput('') }}><Activity size={15} /> Re-analyze</button></div>
            </div>

            {activeView === 'analyze' && <div className="view-stack">
              <section className="section-block health-section"><div className="section-heading"><div><span className="section-index">01</span><div><h2>Project health</h2><p>A quick read on what this repository is made of.</p></div></div><span className="section-status"><span className="status-dot" /> Signals mapped</span></div><div className="stats-grid">{repo.health.map((stat) => { const Icon = iconForStat(stat.icon); return <div className="stat-card" key={stat.label}><div className={`stat-icon tone-${stat.tone}`}><Icon size={16} /></div><div className="stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div></div> })}</div></section>

              <section className="section-block understanding-section"><div className="section-heading"><div><span className="section-index">02</span><div><h2>What is this project?</h2><p>AI-generated context from the repository’s strongest signals.</p></div></div><button className="text-button" onClick={() => setInsight(repo.summary)}>Explain repository <ArrowUpRight size={14} /></button></div><div className="understanding-grid"><div className="summary-card"><div className="summary-mark"><Sparkles size={16} /></div><p>{repo.summary}</p>{insight && <motion.div className="insight-callout" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={14} /><span>{insight}</span><button onClick={() => setInsight('')} aria-label="Dismiss insight"><X size={13} /></button></motion.div>}<div className="summary-footer"><span><span className="status-dot" /> Context confidence: strong</span><span>Generated from 184 files</span></div></div><div className="capability-grid">{repo.capabilities.map((capability) => { const Icon = iconForCapability(capability.icon); return <div className="capability-card" key={capability.name}><div className="capability-icon"><Icon size={16} /></div><div><strong>{capability.name}</strong><p>{capability.summary}</p></div><span className={`capability-status ${capability.status}`}>{capability.status}</span></div> })}</div></div></section>

              <section className="section-block split-section"><div className="section-heading"><div><span className="section-index">03</span><div><h2>Repository explorer</h2><p>Move from structure to the exact file that matters.</p></div></div><button className="text-button" onClick={() => setSearchOpen(true)}>Search files <Search size={14} /></button></div><div className="explorer-grid"><div className="panel file-panel"><div className="panel-header"><div><span className="panel-kicker">FILE TREE</span><strong>Repository structure</strong></div><span className="file-count">{allFiles.length} files</span></div><div className="file-search"><Search size={14} /><input value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder="Filter files..." />{fileQuery && <button onClick={() => setFileQuery('')}><X size={13} /></button>}</div>{fileQuery && searchResults.length > 0 && <div className="inline-search-results">{searchResults.slice(0, 5).map((result) => <button key={result.id} onClick={() => selectedFileFromSearch(result.id)}><FileCode2 size={14} /><span><strong>{result.title}</strong><small>{result.path}</small></span><ArrowUpRight size={13} /></button>)}</div>}<FileTree items={repo.files} selectedId={selectedFile?.id ?? null} onSelect={(item) => { setSelectedFile(item); setInsight('') }} /></div><div className="panel file-detail-panel">{selectedFile ? <FileDetail file={selectedFile} onExplain={() => setInsight(selectedFile.explanation ?? 'This file is an important part of the repository’s current flow.')} insight={insight} scopeSelected={automationScope.some((item) => item.id === selectedFile.id)} onToggleScope={() => toggleAutomationFile(selectedFile)} onGenerateTests={() => void runAutomation('tests')} onReviewCode={() => void runAutomation('review')} scopeCount={automationScope.length} /> : <div className="empty-detail"><div className="empty-detail-icon"><PanelRight size={20} /></div><strong>Select a file to inspect it</strong><p>RepoLens keeps the explanation beside the tree so you can preserve context while exploring.</p><span className="mono">Click any file on the left</span></div>}{automationTab && <AutomationPanel tab={automationTab} state={automationState} tests={generatedTests} review={codeReview} files={automationFiles} onTabChange={setAutomationTab} onGenerateTests={() => void runAutomation('tests')} onReviewCode={() => void runAutomation('review')} />}</div></div></section>
            </div>}

            {activeView === 'map' && <ArchitectureView repo={repo} selectedNode={selectedNode} setSelectedNode={setSelectedNode} query={architectureQuery} setQuery={setArchitectureQuery} onExplain={() => setInsight('The frontend, API and database form the primary spine. Services and AI sit between the route surface and contributor-facing context.')} insight={insight} />}
            {activeView === 'contributions' && <ContributionView repo={repo} state={findState} contributions={contributions.length ? contributions : repo.contributions} selected={selectedContribution} onSelect={setSelectedContribution} onFind={handleFindContribution} onGenerate={handleGenerateIssue} />}
            {activeView === 'issues' && <IssueView state={issueState} issue={issue} contribution={selectedContribution} isDemo={repo.isDemo} onGenerate={handleGenerateIssue} onCopy={copyIssue} copied={copied} />}
            {activeView === 'about' && <AboutView onDemo={handleDemo} />}
          </motion.div>}
        </AnimatePresence>
      </main>

      {searchOpen && repo && <div className="search-overlay" onMouseDown={() => setSearchOpen(false)}><div className="search-dialog" onMouseDown={(event) => event.stopPropagation()}><div className="search-dialog-top"><Search size={18} /><input autoFocus value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder="Search files, components, dependencies..." /><button className="icon-button subtle" onClick={() => setSearchOpen(false)}><X size={16} /></button></div><div className="search-dialog-hint">Repository search <span>•</span> {searchResults.length} result{searchResults.length === 1 ? '' : 's'}</div><div className="search-results">{fileQuery ? searchResults.map((result) => <button key={result.id} onClick={() => selectedFileFromSearch(result.id)}><span className="result-icon"><FileCode2 size={15} /></span><span><strong>{result.title}</strong><small>{result.type} · {result.path}</small></span><ArrowUpRight size={14} /></button>) : <div className="search-empty"><Search size={21} /><p>Search across files, components and dependencies.</p><span>Try “UserCard”, “API” or “loading”</span></div>}</div></div></div>}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAction={handlePaletteAction} activeView={activeView} />
    </div>
  )
}

function FileDetail({ file, onExplain, insight, scopeSelected, onToggleScope, onGenerateTests, onReviewCode, scopeCount }: { file: FileItem; onExplain: () => void; insight: string; scopeSelected: boolean; onToggleScope: () => void; onGenerateTests: () => void; onReviewCode: () => void; scopeCount: number }) {
  return <div className="detail-inner"><div className="detail-topline"><span className="file-badge"><FileCode2 size={14} /> {file.language ?? 'FILE'}</span><span className="mono detail-path">{file.path}</span></div><h3>{file.name}</h3><p className="detail-purpose">{file.purpose}</p><div className="detail-actions"><button className="primary-button small" onClick={onExplain}><Sparkles size={14} /> Explain this file</button><button className="ghost-button small" onClick={() => navigator.clipboard?.writeText(file.path)}><Clipboard size={14} /> Copy path</button></div>{insight && <div className="detail-insight"><Sparkles size={14} /><span>{insight}</span></div>}<div className="detail-columns"><DetailList label="Importance" items={file.importance ? [file.importance] : ['Supporting file in the repository map.']} /><DetailList label="Dependencies" items={file.dependencies ?? []} mono /><DetailList label="Related files" items={file.relatedFiles ?? []} mono /></div><div className="automation-launcher"><div><span className="detail-label">AUTOMATION SCOPE</span><p>{scopeCount ? `${scopeCount} file${scopeCount === 1 ? '' : 's'} selected` : 'Use this file or add more files from the tree.'}</p></div><button className="ghost-button small" onClick={onToggleScope}>{scopeSelected ? <><Check size={14} /> Remove from scope</> : <><ListChecks size={14} /> Add to scope</>}</button></div><div className="automation-buttons"><button className="secondary-button compact" onClick={onGenerateTests}><ListChecks size={15} /> Generate tests</button><button className="primary-button small" onClick={onReviewCode}><Shield size={14} /> Review code</button></div></div>
}

function AutomationPanel({ tab, state, tests, review, files, onTabChange, onGenerateTests, onReviewCode }: { tab: 'tests' | 'review'; state: 'idle' | 'loading' | 'ready' | 'error'; tests: GeneratedTestPlan | null; review: CodeReviewResult | null; files: FileItem[]; onTabChange: (tab: 'tests' | 'review') => void; onGenerateTests: () => void; onReviewCode: () => void }) {
  return <div className="automation-panel"><div className="automation-panel-header"><div><span className="panel-kicker">AUTOMATED WORKBENCH</span><strong>Selected-file intelligence</strong><small>{files.map((file) => file.path).join(' · ')}</small></div><div className="automation-tabs"><button className={tab === 'tests' ? 'is-active' : ''} onClick={() => onTabChange('tests')}><ListChecks size={14} /> Tests</button><button className={tab === 'review' ? 'is-active' : ''} onClick={() => onTabChange('review')}><Shield size={14} /> Review</button></div></div>{state === 'loading' && <div className="automation-loading"><Loader2 size={18} className="spin" /><div><strong>{tab === 'tests' ? 'Generating a test plan...' : 'Reviewing selected files...'}</strong><p>Tracing existing conventions and keeping the output specific to the selected scope.</p></div></div>}{state === 'error' && <div className="inline-error"><AlertCircle size={14} /> Automation failed. <button onClick={tab === 'tests' ? onGenerateTests : onReviewCode}>Try again</button></div>}{state === 'ready' && tab === 'tests' && tests && <div className="automation-result"><div className="result-meta"><span className="status-pill mint"><CheckCircle2 size={13} /> Ready to review</span><span className="mono">{tests.framework}</span></div><h4>{tests.title}</h4><div className="automation-columns"><div><span className="detail-label">TEST FILE</span><span className="path-line mono"><FileCode2 size={13} /> {tests.testFile}</span><span className="detail-label">COVERAGE PLAN</span><ul className="automation-list">{tests.testCases.map((testCase) => <li key={testCase}><Check size={13} /> {testCase}</li>)}</ul></div><pre className="code-preview"><code>{tests.code}</code></pre></div><p className="automation-note"><Sparkles size={13} /> {tests.notes}</p></div>}{state === 'ready' && tab === 'review' && review && <div className="automation-result"><div className="result-meta"><span className={`status-pill ${review.health === 'Looks good' ? 'mint' : review.health === 'High risk' ? 'coral' : 'amber'}`}><Shield size={13} /> {review.health}</span><span>{review.findings.length} finding{review.findings.length === 1 ? '' : 's'}</span></div><h4>Code review summary</h4><p className="review-summary">{review.summary}</p><div className="review-findings">{review.findings.map((finding) => <article className={`review-finding ${finding.severity}`} key={`${finding.file}-${finding.title}`}><div className="finding-icon">{finding.severity === 'positive' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}</div><div><div className="finding-title"><strong>{finding.title}</strong><span>{finding.severity}</span></div><p>{finding.description}</p><span className="path-line mono"><FileCode2 size={13} /> {finding.file}</span><small><b>Recommendation:</b> {finding.recommendation}</small></div></article>)}</div></div>}</div>
}

function DetailList({ label, items, mono = false }: { label: string; items: string[]; mono?: boolean }) { return <div className="detail-list"><span className="detail-label">{label}</span>{items.map((item) => <span className={mono ? 'mono' : ''} key={item}>{item}</span>)}</div> }

function ArchitectureView({ repo, selectedNode, setSelectedNode, query, setQuery, onExplain, insight }: { repo: RepositoryAnalysis; selectedNode: ArchitectureNode | null; setSelectedNode: (node: ArchitectureNode | null) => void; query: string; setQuery: (value: string) => void; onExplain: () => void; insight: string }) {
  return <div className="view-stack map-view"><section className="section-block"><div className="section-heading"><div><span className="section-index">01</span><div><h2>Codebase map</h2><p>Trace the repository from system boundary to the files you will touch.</p></div></div><div className="map-actions"><div className="map-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a node..." />{query && <button onClick={() => setQuery('')}><X size={13} /></button>}</div><button className="text-button" onClick={onExplain}><Sparkles size={14} /> Explain architecture</button></div></div><div className="map-layout"><div className="panel graph-panel"><div className="graph-header"><div><span className="panel-kicker">INTERACTIVE ARCHITECTURE</span><strong>How the pieces connect</strong></div><span className="graph-legend"><i className="legend-dot violet" /> Layers <i className="legend-dot mint" /> Data <i className="legend-dot amber" /> AI</span></div><ArchitectureGraph architecture={repo.architecture} selectedId={selectedNode?.id ?? null} query={query} onSelect={setSelectedNode} /></div><div className="panel node-panel">{selectedNode ? <div className="detail-inner"><div className="node-detail-top"><span className="node-color" style={{ background: selectedNode.color }} /><span>{selectedNode.category} node</span></div><h3>{selectedNode.label}</h3><p className="mono node-subtitle">{selectedNode.subtitle}</p><p className="detail-purpose">{selectedNode.purpose}</p><div className="node-metric"><span><Activity size={14} /> Used by</span><strong>{selectedNode.usedBy.length} surfaces</strong></div><DetailList label="Used by" items={selectedNode.usedBy} /><DetailList label="Dependencies" items={selectedNode.dependencies} mono /><button className="ghost-button full" onClick={onExplain}><Sparkles size={14} /> Why is this dependency important?</button>{insight && <div className="detail-insight"><Sparkles size={14} /><span>{insight}</span></div>}</div> : <div className="empty-detail"><div className="empty-detail-icon"><Network size={20} /></div><strong>Select a node to inspect it</strong><p>Click a layer, service or file on the map to see what it owns and what it depends on.</p><span className="mono">Tip: use the search field to focus the map</span></div>}</div></div></section></div>
}

function ContributionView({ repo, state, contributions, selected, onSelect, onFind, onGenerate }: { repo: RepositoryAnalysis; state: 'idle' | 'loading' | 'ready' | 'error'; contributions: Contribution[]; selected: Contribution | null; onSelect: (contribution: Contribution) => void; onFind: () => void; onGenerate: () => void }) {
  return (
    <div className="view-stack contributions-view">
      <section className="contribution-hero">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> CONTRIBUTION RADAR {repo.isDemo && <span className="demo-chip">DEMO REPOSITORY</span>}</div>
          <h2>Find my first contribution.</h2>
          <p>Start with a task that fits the project’s existing patterns, not a random issue from the backlog.</p>
        </div>
        <button className="primary-button" onClick={onFind} disabled={state === 'loading'}>
          {state === 'loading' ? <><Loader2 size={15} className="spin" /> Finding a fit...</> : <><WandSparkles size={15} /> Find a contribution</>}
        </button>
      </section>
      {state === 'error' && <div className="inline-error"><AlertCircle size={14} /> AI analysis failed. <button onClick={onFind}>Try again</button></div>}
      <div className="contribution-grid">
        <div className="contribution-list">
          <div className="panel-header">
            <div><span className="panel-kicker">RECOMMENDATIONS</span><strong>{state === 'loading' ? 'Scanning project signals...' : `${contributions.length} realistic starting points`}</strong></div>
            <span className="signal-chip"><span className="status-dot" /> Low-risk focus</span>
          </div>
          {state === 'loading' ? (
            <div className="contribution-loading"><div className="loading-orbit"><Sparkles size={17} /></div><strong>Looking for a contribution with context.</strong><p>Checking isolation, existing patterns and likely surface area.</p></div>
          ) : contributions.map((contribution, index) => (
            <button key={contribution.id} className={`contribution-list-item ${selected?.id === contribution.id ? 'is-selected' : ''}`} onClick={() => onSelect(contribution)}>
              <span className="contribution-number">0{index + 1}</span>
              <span><strong>{contribution.title}</strong><small>{contribution.difficulty} · {contribution.effort}</small></span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div className="panel contribution-detail-panel">
          {selected ? (
            <div className="detail-inner">
              <div className="recommendation-label"><span className="pulse-dot" /> YOUR RECOMMENDED CONTRIBUTION</div>
              <h3>{selected.title}</h3>
              <div className="contribution-meta-grid">
                <MetaStat label="Difficulty" value={selected.difficulty} tone="violet" />
                <MetaStat label="Estimated effort" value={selected.effort} tone="blue" />
                <MetaStat label="Impact" value={selected.impact} tone="mint" />
                <MetaStat label="Files involved" value={String(selected.filesInvolved)} tone="amber" />
                <MetaStat label="Risk" value={selected.risk} tone="mint" />
              </div>
              <div className="why-card"><div className="why-icon"><Lightbulb size={16} /></div><div><span className="detail-label">WHY THIS CONTRIBUTION?</span><p>{selected.why}</p></div></div>
              <div className="detail-actions">
                <button className="primary-button small" onClick={onGenerate}><MessageSquareText size={14} /> Generate GitHub Issue</button>
                <button className="ghost-button small" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>See implementation plan <ArrowUpRight size={13} /></button>
              </div>
            </div>
          ) : (
            <div className="empty-detail"><WandSparkles size={22} /><strong>Ready to find your first contribution</strong><p>RepoLens will look for an isolated task with clear files and low risk.</p></div>
          )}
        </div>
      </div>
      {selected && (
        <section className="section-block contribution-plan">
          <div className="section-heading">
            <div><span className="section-index">02</span><div><h2>Contribution details</h2><p>The smallest useful map for making the change confidently.</p></div></div>
            <span className="difficulty-pill">{selected.difficulty}</span>
          </div>
          <div className="plan-grid">
            <div className="plan-card"><span className="detail-label">PROBLEM</span><p>{selected.problem}</p></div>
            <div className="plan-card"><span className="detail-label">WHERE TO WORK</span>{selected.whereToWork.map((file) => <span className="path-chip mono" key={file}><FileCode2 size={13} />{file}</span>)}</div>
            <div className="plan-card plan-wide"><span className="detail-label">IMPLEMENTATION PLAN</span><ol>{selected.implementationPlan.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div>
            <div className="plan-card"><span className="detail-label">FILES TO MODIFY</span>{selected.filesToModify.map((file) => <span className="path-line mono" key={file}><FileCode2 size={13} />{file}</span>)}</div>
            <div className="plan-card"><span className="detail-label">FILES TO UNDERSTAND FIRST</span>{selected.filesToUnderstand.map((file) => <span className="path-line mono" key={file}><BookOpen size={13} />{file}</span>)}</div>
          </div>
        </section>
      )}
    </div>
  )
}

function MetaStat({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className="meta-stat"><span className={`meta-dot ${tone}`} /><div><span>{label}</span><strong>{value}</strong></div></div> }

function IssueView({ state, issue, contribution, isDemo, onGenerate, onCopy, copied }: { state: 'idle' | 'loading' | 'ready' | 'error'; issue: IssuePreview | null; contribution: Contribution | null; isDemo: boolean; onGenerate: () => void; onCopy: () => void; copied: boolean }) {
  if (!contribution) return <div className="empty-view"><div className="empty-detail-icon"><MessageSquareText size={20} /></div><h2>Generate an issue from a contribution.</h2><p>Choose a contribution first and RepoLens will format the context for GitHub.</p></div>
  return <div className="view-stack issue-view"><section className="section-block"><div className="section-heading"><div><span className="section-index">01</span><div><h2>GitHub issue draft {isDemo && <span className="demo-chip">DEMO REPOSITORY</span>}</h2><p>Turn the recommended work into a clear handoff for maintainers.</p></div></div><div className="issue-actions"><button className="ghost-button" onClick={onGenerate} disabled={state === 'loading'}>{state === 'loading' ? <Loader2 size={14} className="spin" /> : <WandSparkles size={14} />} Regenerate</button><button className="primary-button small" onClick={onCopy} disabled={!issue}>{copied ? <><Check size={14} /> Copied</> : <><Clipboard size={14} /> Copy Issue</>}</button></div></div>{state === 'loading' && <div className="issue-loading"><Loader2 size={22} className="spin" /><div><strong>Shaping the issue around existing project language.</strong><p>Pulling the problem, files and acceptance criteria into one maintainer-friendly draft.</p></div></div>}{state === 'error' && <div className="inline-error"><AlertCircle size={14} /> Issue generation failed. <button onClick={onGenerate}>Try again</button></div>}{issue && state === 'ready' && <div className="issue-layout"><div className="issue-paper"><div className="issue-paper-top"><span className="github-label"><Github size={16} /> OPEN-SOURCE-LABS / REPOLENS</span><span className="issue-state"><span /> Draft issue</span></div><h3>{issue.title}</h3><div className="issue-section"><span className="issue-label">Description</span><p>{issue.description}</p></div><div className="issue-section"><span className="issue-label">Proposed solution</span><p>{issue.proposedSolution}</p></div><div className="issue-section"><span className="issue-label">Implementation</span><ul>{issue.implementation.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul></div><div className="issue-section"><span className="issue-label">Acceptance criteria</span><ul>{issue.acceptanceCriteria.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul></div></div><div className="issue-side"><div className="panel issue-meta-card"><span className="panel-kicker">ISSUE READY</span><div className="issue-ready-icon"><CheckCircle2 size={22} /></div><strong>Context included</strong><p>Files, effort and rationale are attached to this draft.</p><div className="issue-side-lines"><span><FileCode2 size={14} /> {contribution.filesInvolved} files</span><span><BookOpen size={14} /> {contribution.difficulty} scope</span><span><Shield size={14} /> {contribution.risk} risk</span></div><button className="ghost-button full" onClick={() => window.alert('Demo action: connect GitHub OAuth to open a real issue from this draft.')}>Open GitHub <ExternalLink size={13} /></button><small className="placeholder-note">Demo placeholder — no issue is created.</small></div></div></div>}</section></div>
}

function AboutView({ onDemo }: { onDemo: () => void }) { return <div className="view-stack about-view"><section className="about-hero"><div className="eyebrow"><span className="eyebrow-line" /> ABOUT REPOLENS</div><h1>A codebase field guide<br /><span>for your first move.</span></h1><p>RepoLens turns the first hour of understanding an unfamiliar codebase into a few minutes of evidence, context and a realistic contribution.</p><button className="primary-button" onClick={onDemo}><Play size={15} fill="currentColor" /> Explore the demo repository</button></section><div className="about-grid"><div className="about-card"><span className="about-number">01</span><h3>Read the shape</h3><p>Get a visual map of how the repository’s layers, services and important files connect.</p></div><div className="about-card"><span className="about-number">02</span><h3>Find the fit</h3><p>Start with a task that follows existing patterns, has a clear surface area and low risk.</p></div><div className="about-card"><span className="about-number">03</span><h3>Ship the handoff</h3><p>Turn the context into an issue draft that a maintainer can act on immediately.</p></div></div><div className="about-footer"><span><Terminal size={14} /> Built for open-source newcomers</span><span>React <i /> FastAPI <i /> PostgreSQL <i /> Contextual AI</span></div></div> }

export default App
