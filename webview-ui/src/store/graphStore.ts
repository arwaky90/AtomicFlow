/**
 * graphStore - Zustand store for graph state management
 * Refactored: Extracted types to store/graph_types.ts
 */
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { OnNodesChange, OnEdgesChange, NodeChange, EdgeChange, OnSelectionChangeParams } from '@xyflow/react';
import { temporal } from 'zundo';
import { 
  type GraphNode, 
  type GraphEdge, 
  type BackendNode, 
  type BackendLink,
  transformBackendNodes,
  transformBackendEdges 
} from './graph_types';
import { useLayoutStore } from './layout_store';

// Re-export types for convenience
export type { GraphNode, GraphEdge } from './graph_types';

interface GraphState {
  // Core data
  nodes: GraphNode[];
  edges: GraphEdge[];
  mode: 'DIRECTORY' | 'DEPENDENCY';
  
  // Navigation
  currentPath: string;
  workspaceRoot: string;
  
  // Selection
  selectedNodes: string[];
  selectedEdges: string[];
  focusedNode: string | null;
  
  // Editor
  editingNode: string | null;
  editorContent: string;
  editorFilePath: string;
  
  // Dialogs
  isCreateDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  nodesToDelete: string[];
  creationTargetPath: string | null;

  
  // Permissions
  canCreate: boolean;
  canDelete: boolean;
  
  // Actions
  setMode: (mode: 'DIRECTORY' | 'DEPENDENCY') => void;
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  setCurrentPath: (path: string) => void;
  setWorkspaceRoot: (root: string) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onSelectionChange: (params: OnSelectionChangeParams) => void;
  setFocusedNode: (nodeId: string | null) => void;
  openEditor: (nodeId: string, content: string, filePath: string) => void;
  closeEditor: () => void;
  openCreateDialog: (path?: string) => void;
  openDeleteDialog: (nodeIds: string[]) => void;
  closeDialogs: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  processBackendData: (data: { nodes: BackendNode[]; links: BackendLink[]; }) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  saveEditorContent: (filePath: string, content: string) => void;
}

export const useGraphStore = create<GraphState>()(
  temporal(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      mode: 'DIRECTORY',
      currentPath: '',
      workspaceRoot: '',
      selectedNodes: [],
      selectedEdges: [],
      focusedNode: null,
      editingNode: null,
      editorContent: '',
      editorFilePath: '',
      isCreateDialogOpen: false,
      isDeleteDialogOpen: false,
      nodesToDelete: [],
      creationTargetPath: null,

      canCreate: true,
      canDelete: true,
      
      // Mode actions
      setMode: (mode) => set({ 
        mode,
        canCreate: mode === 'DIRECTORY',
        canDelete: mode === 'DIRECTORY',
      }),
      
      // Data setters
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setCurrentPath: (currentPath) => set({ currentPath }),
      setWorkspaceRoot: (workspaceRoot) => set({ workspaceRoot }),
      
      // Node/Edge change handlers
      onNodesChange: (changes: NodeChange[]) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as GraphNode[] });
      },
      
      onEdgesChange: (changes: EdgeChange[]) => {
        set({ edges: applyEdgeChanges(changes, get().edges) as GraphEdge[] });
      },

      // Selection
      onSelectionChange: ({ nodes, edges }) => {
        const selectedNodeIds = nodes.map(n => n.id);
        set({
          selectedNodes: selectedNodeIds,
          selectedEdges: edges.map(e => e.id),
          focusedNode: selectedNodeIds.length > 0 
            ? selectedNodeIds[selectedNodeIds.length - 1] 
            : null,
        });
      },

      setFocusedNode: (nodeId) => set({ focusedNode: nodeId }),

      // Editor actions
      // Editor actions
      openEditor: (nodeId, content, filePath) => {
        const { nodes } = get();
        const targetNode = nodes.find(n => n.id === nodeId);
        if (!targetNode) return;

        // Check if editor is already open for this file - if so, maybe close it?
        // User said "otomatis megnhilang kalau dua kali klik" (disappears if double clicked).
        const existingEditor = nodes.find(n => n.id === 'editor-popup');
        if (existingEditor && existingEditor.data.filePath === filePath) {
            // Close it
             set({ 
                nodes: nodes.filter(n => n.id !== 'editor-popup') 
            });
            return;
        }

        // Remove existing editor if open (switching files)
        const cleanNodes = nodes.filter(n => n.id !== 'editor-popup');
        
        // Get the visual position: prefer computedPositions (layout-calculated) if available
        // This ensures we use the RENDERED position, not the original stored position
        let targetX = targetNode.position.x;
        let targetY = targetNode.position.y;

        try {
            const computedPos = useLayoutStore.getState().computedPositions.get(nodeId);
            if (computedPos) {
                targetX = computedPos.x;
                targetY = computedPos.y;
            }
        } catch (e) {
            console.warn('Could not access LayoutStore computed positions', e);
        }

        // Calculate position: target.x + width + gap (1x node width)
        // Default width assumption if not measured
        const nodeWidth = targetNode.measured?.width || 100;
        const x = targetX + nodeWidth + nodeWidth; // gap = 1x node width
        const y = targetY;

        const editorNode: GraphNode = {
          id: 'editor-popup',
          type: 'editor',
          position: { x, y },
          dragHandle: '.editor-drag-handle', // Make it draggable via header
          data: { 
            content, 
            fileName: filePath.split('/').pop() || 'untitled',
            filePath,
            label: filePath.split('/').pop() || 'untitled',
            type: 'editor'
          },
          // Important for layering
          zIndex: 1000, 
        };

        set({ nodes: [...cleanNodes, editorNode] });
      },

      closeEditor: () => {
        set({ 
          nodes: get().nodes.filter(n => n.id !== 'editor-popup') 
        });
      },

      // setEditorContent removed - managed by node internal state

      
      // Dialog actions
      openCreateDialog: (path) => set({ 
        isCreateDialogOpen: true,
        creationTargetPath: path || null 
      }),
      
      openDeleteDialog: (nodeIds) => set({ 
        isDeleteDialogOpen: true, 
        nodesToDelete: nodeIds 
      }),
      
      closeDialogs: () => set({ 
        isCreateDialogOpen: false, 
        isDeleteDialogOpen: false,
        nodesToDelete: [],
        creationTargetPath: null
      }),

      // Selection actions
      selectAll: () => {
        const allNodeIds = get().nodes.map(n => n.id);
        const allEdgeIds = get().edges.map(e => e.id);
        set({
          selectedNodes: allNodeIds,
          selectedEdges: allEdgeIds,
          focusedNode: allNodeIds.length > 0 ? allNodeIds[0] : null,
        });
      },

      clearSelection: () => set({
        selectedNodes: [],
        selectedEdges: [],
        focusedNode: null,
      }),

      // Backend integration
      processBackendData: (data) => {
        set({ 
          nodes: transformBackendNodes(data.nodes), 
          edges: transformBackendEdges(data.links) 
        });
      },

      // Update specific node data (e.g. after AI analysis)
      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map(n => 
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          )
        });
      },
      
      saveEditorContent: (filePath, content) => {
          // Placeholder for now - logic to be connected to backend service
          console.log(`[GraphStore] Saving content for ${filePath}`, content.substring(0, 20) + '...');
          // Update the node data if it exists in the graph
          set({
              nodes: get().nodes.map(n => 
                   n.data.filePath === filePath ? { ...n, data: { ...n.data, content } } : n
              )
          });
      }
    }),
    {
      limit: 100,
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      partialize: (state: GraphState) => ({
        nodes: state.nodes,
        edges: state.edges,
        mode: state.mode,
        currentPath: state.currentPath,
        workspaceRoot: state.workspaceRoot,
        canCreate: state.canCreate,
        canDelete: state.canDelete,
        // Don't persist creationTargetPath
      }),
    }
  )
);
