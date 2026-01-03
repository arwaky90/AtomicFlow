/**
 * graph_config.ts - Graph configuration constants
 * Node types, edge types, and styling functions
 */
import { FileNode } from '@/components/nodes/file_node';
import { FolderNode } from '@/components/nodes/folder_node';
import { KingdomNode } from '@/components/nodes/KingdomNode';
import { ZoneNode } from '@/components/nodes/zone_node';
import { DependencyEdge } from '@/components/edges/dependency_edge';
import type { GraphNode } from '@/store/graphStore';
import EditorNode from '@/components/nodes/EditorNode';

/** Custom nodes registry */
export const NODE_TYPES = {
  file: FileNode,
  folder: FolderNode,
  kingdom: KingdomNode,
  zone: ZoneNode,
  editor: EditorNode,
} as const;

/** Custom edges registry */
export const EDGE_TYPES = {
  dependency: DependencyEdge,
} as const;

/** Default edge styling */
export const DEFAULT_EDGE_OPTIONS = {
  style: { stroke: '#ffffff', strokeWidth: 3 },
  type: 'smoothstep',
} as const;

/** MiniMap node color based on type/role */
export function getMinimapNodeColor(node: GraphNode): string {
  if (node.type === 'folder') return '#f59e0b'; // Amber for folders
  
  // Color based on hexagonal role
  const path = node.data?.path?.toLowerCase() || '';
  if (path.includes('component') || path.includes('view')) return '#3b82f6'; // Blue - Driving
  if (path.includes('domain') || path.includes('core')) return '#eab308'; // Yellow - Domain
  if (path.includes('composable') || path.includes('hook')) return '#a855f7'; // Purple - Application
  if (path.includes('adapter') || path.includes('api')) return '#ef4444'; // Red - Driven
  
  return '#6b7280'; // Default gray
}
