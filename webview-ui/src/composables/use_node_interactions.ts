/**
 * use_node_interactions.ts - Composable for node interaction handlers
 * Handles double-click, drag-stop with snap-to-grid
 */
import { useCallback } from 'react';
import type { GraphNode } from '@/store/graphStore';
import { useGraphStore } from '@/store/graphStore';
import { useFolderStore } from '@/store/folder_navigation_store';
import { useVsCode } from '@/hooks/useVsCode';

interface NodeInteractionsResult {
  handleNodeDoubleClick: (event: React.MouseEvent, node: GraphNode) => void;
  handleNodeDragStop: (
    event: React.MouseEvent, 
    node: GraphNode, 
    setLocalNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>
  ) => void;
}

const SNAP_SIZE = 80;

/**
 * Provides node interaction handlers
 */
export function useNodeInteractions(): NodeInteractionsResult {
  const { nodes, setNodes, mode } = useGraphStore();

  const { postMessage } = useVsCode();
  
  /** Navigate into folder or open file editor */
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: GraphNode) => {
    if (node.type === 'folder') {
      const path = node.data.path;
      if (path) {
        useFolderStore.getState().navigateInto(path);
      }
      // Reset positions for re-layout
      setNodes(nodes.map(n => ({ ...n, position: { x: 0, y: 0 } })));
      return;
    }

    if (node.data?.path && node.type === 'file') {
      postMessage({
        command: 'getFileContent',
        path: node.data.path,
      });
    }
  }, [nodes, setNodes, postMessage]);

  /** Snap node to grid on drag stop */
  const handleNodeDragStop = useCallback((
    _event: React.MouseEvent, 
    node: GraphNode,
    setLocalNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>
  ) => {
    const snappedX = Math.round(node.position.x / SNAP_SIZE) * SNAP_SIZE;
    const snappedY = Math.round(node.position.y / SNAP_SIZE) * SNAP_SIZE;
    
    const updatePosition = (n: GraphNode): GraphNode => 
      n.id === node.id 
        ? { ...n, position: { x: snappedX, y: snappedY } } 
        : n;

    if (mode === 'DIRECTORY') {
      setLocalNodes(nds => nds.map(updatePosition));
    } else {
      setNodes(nodes.map(updatePosition) as GraphNode[]);
    }
  }, [mode, nodes, setNodes]);

  return {
    handleNodeDoubleClick,
    handleNodeDragStop
  };
}
