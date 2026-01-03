/**
 * GraphVisualizer.tsx - Main graph visualization component
 * Refactored: Logic extracted to composables and domain config
 */
import { useEffect } from 'react';
import { ReactFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/store/graphStore';
import { useFolderStore } from '@/store/folder_navigation_store';
import { useLayoutStore } from '@/store/layout_store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Composables (Application Layer)
import { useGraphLayout } from '@/composables/use_graph_layout';
import { useGraphNodes } from '@/composables/use_graph_nodes';
import { useNodeInteractions } from '@/composables/use_node_interactions';

// Domain Config
import { NODE_TYPES, EDGE_TYPES, DEFAULT_EDGE_OPTIONS, getMinimapNodeColor } from '@/domain/graph/graph_config';

// UI Components
import { CanvasContextMenu } from './menus/canvas_context_menu';
import { CreateNodeDialog } from './dialogs/CreateNodeDialog';
import { DeleteConfirmDialog } from './dialogs/DeleteConfirmDialog';

export function GraphVisualizer() {
  const { 
    nodes, 
    onEdgesChange, 
    setNodes, 
    onSelectionChange,
    mode,
    isCreateDialogOpen,
    isDeleteDialogOpen
  } = useGraphStore();
  
  
  const { currentFolder } = useFolderStore();
  // Use selectors to avoid re-renders when computedPositions update
  const isArranging = useLayoutStore(s => s.isArranging);
  const setIsArranging = useLayoutStore(s => s.setIsArranging);

  useKeyboardShortcuts();

  // Composables
  const { displayNodes, displayEdges } = useGraphLayout();
  const { finalNodes, handleNodesChange, setLocalNodes } = useGraphNodes(displayNodes);
  const { handleNodeDoubleClick, handleNodeDragStop } = useNodeInteractions();

  // Re-layout trigger
  useEffect(() => {
    if (isArranging) {
      setNodes(nodes.map(n => ({ ...n, position: { x: 0, y: 0 } })));
      setIsArranging(false);
    }
  }, [isArranging, nodes, setNodes, setIsArranging]);

  return (
    <CanvasContextMenu>
      <div className="w-full h-full">
        <ReactFlow 
          key={`flow-${currentFolder}-${mode}`}
          nodes={finalNodes} 
          edges={displayEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          colorMode="dark"
          minZoom={0.1}
          maxZoom={4}
          fitView
          fitViewOptions={{ padding: 0.3, includeHiddenNodes: false }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Shift"
          panOnDrag={[1]}
          panOnScroll={false}
          panActivationKeyCode="Space"
          selectionOnDrag
          onNodeDragStop={(e, node) => handleNodeDragStop(e, node, setLocalNodes)}
        >
          <div className="absolute inset-0 bg-[#1e1e1e] -z-10 transition-colors duration-500" />
          <Background 
            color="#888" 
            gap={80} 
            size={1} 
            variant={BackgroundVariant.Dots}
            style={{ opacity: 0.15 }}
          />
          <Controls 
            position="bottom-right"
            style={{ marginBottom: '170px', marginRight: '15px' }}
            className="!bg-background/50 !backdrop-blur !border-border/50 !fill-foreground"
            showInteractive={false}
          />
          <MiniMap 
            nodeColor={getMinimapNodeColor}
            className="!bg-background/50 !backdrop-blur !border-border/50"
            pannable
            zoomable
          />
        </ReactFlow>

        {isCreateDialogOpen && <CreateNodeDialog />}
        {isDeleteDialogOpen && <DeleteConfirmDialog />}
      </div>
    </CanvasContextMenu>
  );
}
