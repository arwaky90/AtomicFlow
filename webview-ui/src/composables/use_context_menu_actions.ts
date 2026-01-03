import { useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useLayoutStore } from '@/store/layout_store';

/**
 * Composable for all context menu actions.
 * Extracts business logic from UI components per Hexagonal Architecture.
 */
export function useContextMenuActions() {
  const { 
    mode, 
    setMode, 
    nodes, 
    setNodes,
    selectedNodes,
    selectAll: storeSelectAll,
    clearSelection,
    openCreateDialog,
    openDeleteDialog,
    setFocusedNode,
  } = useGraphStore();
  
  const { undo, redo } = useGraphStore.temporal.getState();
  const { setIsArranging } = useLayoutStore();

  // ═══════════════════════════════════════════════════════════════════
  // CANVAS ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  /** Opens the create file/folder dialog */
  const handleCreateNew = useCallback((targetNodeId?: string) => {
    if (mode !== 'DIRECTORY') return;

    let targetPath: string | undefined;

    if (targetNodeId) {
      const node = nodes.find(n => n.id === targetNodeId);
      if (node?.data?.path) {
        if (node.type === 'folder') {
          // If folder, create inside it
          targetPath = node.data.path;
        } else {
          // If file, create in same directory
          // Remove filename from path to get parent dir
          targetPath = node.data.path.substring(0, node.data.path.lastIndexOf('/'));
        }
      }
    }

    openCreateDialog(targetPath);
  }, [mode, nodes, openCreateDialog]);

  /** Switches to Dependency mode to find dependencies */
  const handleFindDependencies = useCallback(() => {
    setMode('DEPENDENCY');
  }, [setMode]);

  /** Triggers auto-layout of all visible nodes */
  const handleArrangeAll = useCallback(() => {
    setIsArranging(true);
  }, [setIsArranging]);

  /** Re-fetches graph data from backend */
  const handleRefreshView = useCallback(() => {
    // Reset node positions to trigger re-layout
    setNodes(nodes.map(n => ({ ...n, position: { x: 0, y: 0 } })));
    
    // Request fresh data from VS Code extension
    const vscode = window.vscode;
    if (vscode) {
      vscode.postMessage({ command: 'refresh' });
    }
  }, [nodes, setNodes]);

  /** Pastes copied path (placeholder - clipboard API) */
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      console.log('[ContextMenu] Paste:', text);
      // TODO: Implement paste logic based on clipboard content
    } catch (err) {
      console.warn('[ContextMenu] Clipboard read failed:', err);
    }
  }, []);

  /** Selects all visible nodes */
  const handleSelectAll = useCallback(() => {
    storeSelectAll();
  }, [storeSelectAll]);

  /** Undo last action */
  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  /** Redo last undone action */
  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  // ═══════════════════════════════════════════════════════════════════
  // NODE ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  /** Opens file in VS Code editor */
  const handleOpenInEditor = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.data?.path) return;

    const vscode = window.vscode;
    if (vscode) {
      vscode.postMessage({
        command: 'openFile',
        path: node.data.path,
      });
    }
  }, [nodes]);

  /** Opens rename dialog for a node */
  const handleRename = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.data?.path) return;

    const vscode = window.vscode;
    if (vscode) {
      vscode.postMessage({
        command: 'renameFile',
        path: node.data.path,
      });
    }
  }, [nodes]);

  /** Copies absolute path(s) to clipboard */
  const handleCopyPath = useCallback(async (nodeIds: string[]) => {
    const paths = nodeIds
      .map(id => nodes.find(n => n.id === id)?.data?.path)
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(paths);
      console.log('[ContextMenu] Copied paths:', paths);
    } catch (err) {
      console.warn('[ContextMenu] Clipboard write failed:', err);
    }
  }, [nodes]);

  /** Duplicates a file/folder */
  const handleDuplicate = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.data?.path) return;

    const vscode = window.vscode;
    if (vscode) {
      vscode.postMessage({
        command: 'duplicateFile',
        path: node.data.path,
      });
    }
  }, [nodes]);

  /** Focuses node and switches to Dependency mode */
  const handleShowDependencies = useCallback((nodeId: string) => {
    clearSelection();
    setFocusedNode(nodeId);
    setMode('DEPENDENCY');
  }, [setFocusedNode, setMode, clearSelection]);

  /** Opens delete confirmation dialog */
  const handleDelete = useCallback((nodeIds: string[]) => {
    if (mode === 'DIRECTORY' && nodeIds.length > 0) {
      openDeleteDialog(nodeIds);
    }
  }, [mode, openDeleteDialog]);

  /** Shows properties panel for a node */
  const handleShowProperties = useCallback((nodeId: string) => {
    setFocusedNode(nodeId);
  }, [setFocusedNode]);

  return {
    // Canvas Actions
    handleCreateNew,
    handleFindDependencies,
    handleArrangeAll,
    handleRefreshView,
    handlePaste,
    handleSelectAll,
    handleUndo,
    handleRedo,

    // Node Actions
    handleOpenInEditor,
    handleRename,
    handleCopyPath,
    handleDuplicate,
    handleShowDependencies,
    handleDelete,
    handleShowProperties,

    // State
    mode,
    selectedNodes,
  };
}
