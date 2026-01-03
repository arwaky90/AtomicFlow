/**
 * VSCode Message Handler - Handles messages from VS Code extension
 * Extracted from App.tsx for modularity
 */
import type { GraphNode } from '@/store/graphStore';
import type { BackendNode, BackendLink } from '@/store/graph_types';

export interface SourceFolder {
  path: string;
  name: string;
  relativePath: string;
  fileCount: number;
}

export type ViewState = 'loading' | 'dashboard' | 'graph';

export interface MessageHandlerCallbacks {
  setDashboardFolders: (folders: SourceFolder[]) => void;
  setWorkspaceRoot: (root: string) => void;
  setViewState: (state: ViewState) => void;
  processBackendData: (data: { nodes: BackendNode[]; links: BackendLink[] }) => void;
  setSourceRoot: (sourceRoot: string, workspaceRoot: string, name: string) => void;
  openEditor: (nodeId: string, content: string, filePath: string) => void;
  setFocusedNode: (nodeId: string) => void;
  findNodeByPath: (path: string) => GraphNode | undefined;
  // Context menu action callbacks
  updateNodePath?: (oldPath: string, newPath: string, newName: string) => void;
  duplicateNode?: (originalPath: string, newPath: string, newName: string) => void;
  removeNodes?: (paths: string[]) => void;
}

/**
 * Create a message handler for VS Code communication
 */
export function createMessageHandler(callbacks: MessageHandlerCallbacks) {
  return (event: MessageEvent) => {
    const message = event.data;
    
    // Show dashboard for folder selection
    if (message.command === 'showDashboard') {
      console.log('[AtomicFlow] Showing dashboard with folders:', message.folders?.length);
      callbacks.setDashboardFolders(message.folders || []);
      callbacks.setWorkspaceRoot(message.workspaceRoot || '');
      callbacks.setViewState('dashboard');
    }
    
    // Graph data received - switch to graph view
    if (message.command === 'updateGraph' && message.data) {
      console.log('[AtomicFlow] Graph data received:', message.data.nodes?.length, 'nodes');
      callbacks.processBackendData(message.data);
      
      // Update folder store with source root info
      if (message.sourceRoot) {
        callbacks.setSourceRoot(
          message.sourceRoot,
          message.workspaceRoot || '',
          message.sourceRootName || 'src'
        );
      }
      
      callbacks.setViewState('graph');
    }
    
    // Handle file content for editor
    if (message.command === 'fileContent') {
      const node = callbacks.findNodeByPath(message.filePath);
      if (node) {
        callbacks.openEditor(node.id, message.content, message.filePath);
      }
    }

    // Handle focus node (lightweight update)
    if (message.command === 'focusNode' && message.filePath) {
      console.log('[AtomicFlow] Focusing node from backend:', message.filePath);
      const node = callbacks.findNodeByPath(message.filePath);
      if (node) {
        callbacks.setFocusedNode(node.id);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTEXT MENU ACTION RESPONSES
    // ═══════════════════════════════════════════════════════════════════

    // Handle file renamed
    if (message.command === 'fileRenamed') {
      console.log('[AtomicFlow] File renamed:', message.oldPath, '→', message.newPath);
      if (callbacks.updateNodePath) {
        callbacks.updateNodePath(message.oldPath, message.newPath, message.newName);
      }
    }

    // Handle file duplicated
    if (message.command === 'fileDuplicated') {
      console.log('[AtomicFlow] File duplicated:', message.originalPath, '→', message.newPath);
      if (callbacks.duplicateNode) {
        callbacks.duplicateNode(message.originalPath, message.newPath, message.newName);
      }
    }

    // Handle files deleted
    if (message.command === 'filesDeleted') {
      console.log('[AtomicFlow] Files deleted:', message.paths);
      if (callbacks.removeNodes) {
        callbacks.removeNodes(message.paths);
      }
    }
  };
}
