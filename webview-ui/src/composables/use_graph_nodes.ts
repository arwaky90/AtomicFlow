import { useState, useEffect, useCallback, useMemo } from 'react';
import { applyNodeChanges } from '@xyflow/react';
import type { NodeChange } from '@xyflow/react';
import { type GraphNode } from '@/store/graphStore';
import { useLayoutStore } from '@/store/layout_store';

interface GraphNodesResult {
  finalNodes: GraphNode[];
  handleNodesChange: (changes: NodeChange<GraphNode>[]) => void;
  setLocalNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>;
}

/**
 * Helper: Sync positions to LayoutStore for editor popup positioning
 */
function syncPositionsToLayoutStore(nodes: GraphNode[]): void {
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach(node => {
    positions.set(node.id, node.position);
  });
  useLayoutStore.getState().setComputedPositions(positions);
}

/**
 * Helper: Merge displayNodes with preserved positions from current nodes
 */
function mergeNodesWithPreservedPositions(
  displayNodes: GraphNode[],
  currentNodes: GraphNode[]
): GraphNode[] {
  // Create a map of current positions to preserve dragged positions
  const currentPositionMap = new Map<string, { x: number; y: number }>();
  currentNodes.forEach(node => {
    currentPositionMap.set(node.id, node.position);
  });
  
  // Merge displayNodes with preserved positions
  return displayNodes.map(displayNode => {
    const existingPosition = currentPositionMap.get(displayNode.id);
    if (existingPosition) {
      // Preserve existing position for existing nodes (respects user drag)
      return { ...displayNode, position: existingPosition };
    }
    // New nodes use their layout-computed position
    return displayNode;
  });
}

/**
 * Manages node state with mode-awareness
 * - DIRECTORY mode uses local state (enables dragging without global sync)
 * - DEPENDENCY mode uses global store
 */
export function useGraphNodes(displayNodes: GraphNode[]): GraphNodesResult {
  // Compute merged nodes directly (not in effect) to avoid cascading renders
  const displayNodesSignature = useMemo(() => 
    displayNodes.map(n => n.id).join(','), 
    [displayNodes]
  );
  const [prevSignature, setPrevSignature] = useState<string>('');
  
  // Local state for BOTH modes
  const [localNodes, setLocalNodes] = useState<GraphNode[]>(() => {
    syncPositionsToLayoutStore(displayNodes);
    return displayNodes;
  });

  // Derived State Pattern: Sync localNodes when displayNodes structure changes
  // This runs during render, preventing cascading effects and ref access issues
  if (displayNodesSignature !== prevSignature) {
    setPrevSignature(displayNodesSignature);
    
    // Compute merged nodes
    const mergedNodes = mergeNodesWithPreservedPositions(displayNodes, localNodes);
    
    // Check if actual changes are needed
    const nodesChanged = mergedNodes.some((node, i) => 
      localNodes[i]?.id !== node.id || 
      localNodes[i]?.position.x !== node.position.x ||
      localNodes[i]?.position.y !== node.position.y
    ) || mergedNodes.length !== localNodes.length;

    if (nodesChanged) {
      setLocalNodes(mergedNodes);
      syncPositionsToLayoutStore(mergedNodes);
    }
  }

  // Sync positions to LayoutStore whenever localNodes changes (e.g. dragging)
  useEffect(() => {
    syncPositionsToLayoutStore(localNodes);
  }, [localNodes]);

  // Handler for node changes - also syncs position updates to LayoutStore SYNCHRONOUSLY
  const handleNodesChange = useCallback((changes: NodeChange<GraphNode>[]) => {
    // We now use local state for ALL modes to support smooth dragging
    setLocalNodes(nds => {
      const updatedNodes = applyNodeChanges(changes, nds) as GraphNode[];
      
      // Check if any position changes occurred
      const hasPositionChanges = changes.some(c => c.type === 'position' && 'position' in c && c.position);
      
      if (hasPositionChanges) {
        // Sync ALL positions to LayoutStore SYNCHRONOUSLY
        // This ensures positions are available immediately when openEditor is called
        syncPositionsToLayoutStore(updatedNodes);
      }
      
      return updatedNodes;
    });
    
    // Original onNodesChange logic for propagating changes locally if using ReactFlow's hook?
    // Actually we only need to call global onNodesChange if we want to PERSIST to store.
    // But for viewing, local state is sufficient.
    // The original code called onNodesChange for non-DIRECTORY modes.
    // If we want to persist dragging in dependency mode, we might want to *eventually* save it,
    // but for now, we just want to stop the snap-back.
    // So completely replacing onNodesChange with local setLocalNodes is the correct path for "visual" dragging.
    
  }, []);

  // Final nodes based on mode
  // Now always use localNodes as it's kept in sync with displayNodes + user drags
  const finalNodes = localNodes;

  return {
    finalNodes,
    handleNodesChange,
    setLocalNodes: setLocalNodes
  };
}
