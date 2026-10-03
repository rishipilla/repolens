import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, GitBranch, Keyboard, Map, MessageSquareText, Search, Sparkles, WandSparkles, X } from 'lucide-react'
import type { ViewKey } from './types/repository'

export type PaletteAction = 'search' | 'map' | 'contribution' | 'issue' | 'explain'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onAction: (action: PaletteAction) => void
  activeView: ViewKey
}

const commands: Array<{ id: PaletteAction; title: string; description: string; shortcut: string; icon: typeof Search }> = [
  { id: 'search', title: 'Search repository', description: 'Find files, components and dependencies', shortcut: '⌘ K', icon: Search },
  { id: 'map', title: 'Open architecture', description: 'See how the major layers connect', shortcut: 'M', icon: Map },
  { id: 'contribution', title: 'Find contribution', description: 'Surface a realistic first task', shortcut: 'F', icon: WandSparkles },
  { id: 'issue', title: 'Generate issue', description: 'Turn the recommendation into a draft', shortcut: 'I', icon: MessageSquareText },
  { id: 'explain', title: 'Explain repository', description: 'Read the project summary and signals', shortcut: 'E', icon: Sparkles },
]

export function CommandPalette({ open, onClose, onAction, activeView }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const filtered = useMemo(() => commands.filter((command) => `${command.title} ${command.description}`.toLowerCase().includes(query.toLowerCase())), [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setHighlighted(0)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowDown') { event.preventDefault(); setHighlighted((value) => Math.min(value + 1, filtered.length - 1)) }
      if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted((value) => Math.max(value - 1, 0)) }
      if (event.key === 'Enter' && filtered[highlighted]) { event.preventDefault(); onAction(filtered[highlighted].id); onClose() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, filtered, highlighted, onAction, onClose])

  if (!open) return null
  return (
    <div className="palette-backdrop" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-search">
          <Search size={18} />
          <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setHighlighted(0) }} placeholder="Search commands..." />
          <button className="icon-button subtle" aria-label="Close command palette" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="palette-hint"><Keyboard size={13} /> Tip: press <kbd>Ctrl</kbd><span>+</span><kbd>K</kbd> anytime</div>
        <div className="palette-list">
          {filtered.length ? filtered.map((command, index) => {
            const Icon = command.icon
            return <button key={command.id} className={`palette-item ${highlighted === index ? 'is-highlighted' : ''}`} onMouseEnter={() => setHighlighted(index)} onClick={() => { onAction(command.id); onClose() }}>
              <span className="palette-item-icon"><Icon size={17} /></span>
              <span className="palette-item-copy"><strong>{command.title}</strong><small>{command.description}</small></span>
              {activeView === command.id && <span className="active-dot" />}
              <span className="palette-shortcut">{command.shortcut}</span>
              <ArrowUpRight size={14} className="palette-arrow" />
            </button>
          }) : <div className="palette-empty"><GitBranch size={20} /> No commands match “{query}”</div>}
        </div>
      </div>
    </div>
  )
}
