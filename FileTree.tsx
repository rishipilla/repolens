import { useState } from 'react'
import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen } from 'lucide-react'
import type { FileItem } from './types/repository'

interface FileTreeProps {
  items: FileItem[]
  selectedId: string | null
  onSelect: (item: FileItem) => void
}

function TreeRow({ item, depth, selectedId, onSelect }: { item: FileItem; depth: number; selectedId: string | null; onSelect: (item: FileItem) => void }) {
  const [open, setOpen] = useState(depth < 1)
  const isFolder = item.kind === 'folder'
  return (
    <div>
      <button
        className={`tree-row ${selectedId === item.id ? 'is-selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 17}px` }}
        onClick={() => isFolder ? setOpen((value) => !value) : onSelect(item)}
      >
        <span className="tree-toggle">{isFolder ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="tree-spacer" />}</span>
        {isFolder ? (open ? <FolderOpen size={15} className="folder-icon" /> : <Folder size={15} className="folder-icon" />) : <FileCode2 size={14} className="file-icon" />}
        <span className="tree-name">{item.name}</span>
        {!isFolder && item.language && <span className="tree-lang">{item.language}</span>}
      </button>
      {isFolder && open && item.children?.map((child) => <TreeRow key={child.id} item={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />)}
    </div>
  )
}

export function FileTree({ items, selectedId, onSelect }: FileTreeProps) {
  return <div className="file-tree">{items.map((item) => <TreeRow key={item.id} item={item} depth={0} selectedId={selectedId} onSelect={onSelect} />)}</div>
}
