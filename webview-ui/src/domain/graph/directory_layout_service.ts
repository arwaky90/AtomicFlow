import type { GraphNode, GraphEdge } from '@/store/graphStore';
import { Position } from '@xyflow/react';

// ============================================================================
// DIRECTORY LAYOUT SERVICE
// Responsibility: Hierarchical layout for Directory/Explorer mode
// ============================================================================

/** Layout constants for directory tree */
const LAYOUT_CONFIG = {
  PARENT_X: 600,          // Parent position (right side)
  PARENT_Y: 80,           // Parent at top
  CHILD_X: 80,            // Children on left
  CHILD_START_Y: 240,     // First child Y position
  GAP_Y: 160,             // Vertical gap between children
  EXPANDED_EXTRA: 320,    // Extra height for expanded folders
} as const;

/** Normalize path by removing trailing slashes */
function normalizePath(path: string): string {
  return path?.replace(/\/+$/, '') || '';
}

/**
 * Create the parent/header node for directory view.
 */
export function createParentNode(currentFolder: string): GraphNode {
  const targetPath = normalizePath(currentFolder);
  const folderName = targetPath.split('/').pop() || 'Root';

  return {
    id: 'directory-header-root',
    type: 'folder',
    position: { x: LAYOUT_CONFIG.PARENT_X, y: LAYOUT_CONFIG.PARENT_Y },
    width: 200,
    height: 80,
    zIndex: 1000,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      label: folderName,
      type: 'folder',
      path: targetPath,
      isExpanded: true,
      childCount: 0,
      isCurrentCanvas: true,
    },
  };
}

/**
 * Filter nodes to only include direct children of target folder.
 */
export function filterChildNodes(nodes: GraphNode[], currentFolder: string): GraphNode[] {
  const targetPath = normalizePath(currentFolder);

  return nodes.filter(node => {
    const nodePath = node.data?.path || node.path;
    if (!nodePath) return false;

    // Skip if this node IS the current folder
    if (normalizePath(nodePath) === targetPath) return false;

    // Check if parent matches target
    const pathParts = nodePath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = '/' + pathParts.join('/');
    return normalizePath(parentPath) === targetPath;
  });
}

/**
 * Sort children: folders first (A-Z), then files (A-Z).
 */
export function sortChildren(children: GraphNode[]): GraphNode[] {
  return [...children].sort((a, b) => {
    if (a.type === b.type) {
      const labelA = (a.data.label as string) || '';
      const labelB = (b.data.label as string) || '';
      return labelA.localeCompare(labelB);
    }
    return a.type === 'folder' ? -1 : 1;
  });
}

/**
 * Position children vertically with expanded folder spacing.
 */
export function layoutChildren(
  children: GraphNode[],
  expandedFolders: Set<string>
): GraphNode[] {
  let currentY = LAYOUT_CONFIG.CHILD_START_Y;

  return children.map(child => {
    const isExpanded = expandedFolders.has(
      child.data.path as string || child.data.id as string || child.id
    );
    const nodeY = currentY;

    // Accumulate Y for next node
    currentY += LAYOUT_CONFIG.GAP_Y + (isExpanded ? LAYOUT_CONFIG.EXPANDED_EXTRA : 0);

    // Force correct node type for Directory mode (not kingdom/zone)
    const nodeType = child.type === 'folder' || (child.data?.childCount && (child.data.childCount as number) > 0) 
      ? 'folder' 
      : 'file';

    return {
      ...child,
      type: nodeType,
      position: { x: LAYOUT_CONFIG.CHILD_X, y: nodeY },
      targetPosition: Position.Right,
      sourcePosition: Position.Left,
    };
  });
}

/**
 * Create structural edges from parent to children.
 */
export function createStructureEdges(parentNode: GraphNode, children: GraphNode[]) {
  return children.map(child => ({
    id: `dir-link-${parentNode.id}-${child.id}`,
    source: parentNode.id,
    sourceHandle: 'source',
    target: child.id,
    targetHandle: 'target',
    type: 'step',
    style: { stroke: '#67e8f9', strokeWidth: 2 },
  }));
}

/**
 * Full directory layout pipeline.
 */
export function createDirectoryLayout(
  nodes: GraphNode[],
  currentFolder: string,
  expandedFolders: Set<string>
): { displayNodes: GraphNode[]; displayEdges: GraphEdge[] } {
  const parentNode = createParentNode(currentFolder);
  
  // Separate editor nodes from directory content
  const editorNodes = nodes.filter(n => n.type === 'editor');
  
  const children = filterChildNodes(nodes, currentFolder);
  const sortedChildren = sortChildren(children);
  const layoutedChildren = layoutChildren(sortedChildren, expandedFolders);
  const structureEdges = createStructureEdges(parentNode, layoutedChildren);

  return {
    displayNodes: [parentNode, ...layoutedChildren, ...editorNodes],
    displayEdges: structureEdges,
  };
}
