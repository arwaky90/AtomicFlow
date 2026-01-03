/**
 * use_graph_layout.ts - Composable for graph layout computation
 * Handles mode-based layout (Kingdom vs Directory)
 */
import { useMemo, useEffect } from 'react';
import { useGraphStore, type GraphNode, type GraphEdge } from '@/store/graphStore';
import { useFolderStore } from '@/store/folder_navigation_store';
import { useLayoutStore } from '@/store/layout_store';
import { 
  transformNodesToKingdom, 
  calculateKingdomLayout,
} from '@/domain/graph';
import { createDirectoryLayout } from '@/domain/graph/directory_layout_service';

interface LayoutResult {
  displayNodes: GraphNode[];
  displayEdges: GraphEdge[];
}

/**
 * Computes layout based on current mode
 * - DEPENDENCY: Kingdom zone-based layout
 * - DIRECTORY: Folder tree layout
 */
export function useGraphLayout(): LayoutResult {
  const { nodes, edges, mode } = useGraphStore();
  const { currentFolder, expandedFolders } = useFolderStore();

  const layoutResult = useMemo(() => {
    if (mode === 'DEPENDENCY') {
      // KINGDOM MODE: Transform, position in zones, add zone backgrounds
      const editorNodes = nodes.filter(n => n.type === 'editor');
      const standardNodes = nodes.filter(n => n.type !== 'editor');
      
      const kingdomNodes = transformNodesToKingdom(standardNodes);
      
      // Calculate full hierarchical layout (Rings -> Zones -> Nodes)
      const layoutNodes = calculateKingdomLayout(kingdomNodes);
      
      return { 
        displayNodes: [...layoutNodes, ...editorNodes], 
        displayEdges: edges 
      };
    }
    
    // DIRECTORY MODE: Use modular layout service
    return createDirectoryLayout(nodes, currentFolder, expandedFolders);

  }, [nodes, edges, mode, currentFolder, expandedFolders]);

  // Sync computed positions to LayoutStore for other components (e.g. Editor Popup) to use
  // This works for BOTH modes so the editor popup can find correct positions
  useEffect(() => {
    const positionMap = new Map<string, { x: number, y: number }>();
    layoutResult.displayNodes.forEach(n => {
      positionMap.set(n.id, n.position);
    });
    
    // Avoid infinite loops by checking equality if needed, but here we just set it.
    // GraphVisualizer is protected via selectors.
    useLayoutStore.getState().setComputedPositions(positionMap);
  }, [layoutResult, mode]);

  return layoutResult;
}
