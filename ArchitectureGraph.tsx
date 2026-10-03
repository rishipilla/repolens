import { useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Architecture, ArchitectureNode } from './types/repository'

interface GraphNodeData extends Record<string, unknown>, ArchitectureNode {
  selected: boolean
  matches: boolean
}

function LensNode({ data }: NodeProps<Node<GraphNodeData>>) {
  return (
    <div className={`lens-node ${data.selected ? 'is-selected' : ''} ${data.matches ? 'is-match' : ''}`} style={{ '--node-color': data.color } as React.CSSProperties}>
      <Handle type="target" position={Position.Top} />
      <div className="lens-node-kicker">{data.category}</div>
      <strong>{data.label}</strong>
      <span>{data.subtitle}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes = { lens: LensNode }

interface ArchitectureGraphProps {
  architecture: Architecture
  selectedId: string | null
  query: string
  onSelect: (node: ArchitectureNode) => void
}

export function ArchitectureGraph({ architecture, selectedId, query, onSelect }: ArchitectureGraphProps) {
  const normalized = query.trim().toLowerCase()
  const nodes = useMemo<Node<GraphNodeData>[]>(() => architecture.nodes.map((node) => ({
    id: node.id,
    type: 'lens',
    position: { x: node.x, y: node.y },
    data: {
      ...node,
      selected: node.id === selectedId,
      matches: !normalized || `${node.label} ${node.subtitle} ${node.purpose}`.toLowerCase().includes(normalized),
    },
  })), [architecture.nodes, normalized, selectedId])
  const edges = useMemo<Edge[]>(() => architecture.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: edge.label,
    animated: edge.from === selectedId || edge.to === selectedId,
    style: { stroke: edge.from === selectedId || edge.to === selectedId ? '#7C5CFC' : '#314056', strokeWidth: edge.from === selectedId || edge.to === selectedId ? 2 : 1 },
    labelStyle: { fill: '#9AA4B2', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' },
    labelBgStyle: { fill: '#10151F', fillOpacity: 0.9 },
  })), [architecture.edges, selectedId])

  return (
    <div className="architecture-canvas" aria-label="Interactive repository architecture map">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.35}
        maxZoom={1.6}
        onNodeClick={(_, node) => {
          const selected = architecture.nodes.find((candidate) => candidate.id === node.id)
          if (selected) onSelect(selected)
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#263040" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor={(node) => (node.data as unknown as GraphNodeData).color} maskColor="rgba(8,11,18,0.74)" />
      </ReactFlow>
      {query && (
        <div className="graph-query-note">
          {nodes.filter((node) => node.data.matches).length} matching nodes
        </div>
      )}
    </div>
  )
}
