import { useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useLayoutStore } from '@/store/layout_store';
import { useReactFlow } from '@xyflow/react';

/** Cross-platform Ctrl/Cmd detection */
const isCtrlOrCmd = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;

/**
 * Nuke-style keyboard shortcuts hook
 * Based on plan/04_keyboard_shortcuts.md
 */
export function useKeyboardShortcuts() {
  const store = useGraphStore();
  const layoutStore = useLayoutStore();
  const { undo, redo } = useGraphStore.temporal.getState();
  
  const reactFlow = useReactFlow();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Escape to close editor
        if (e.key === 'Escape') {
          e.preventDefault();
          store.closeEditor();
        }
        return;
      }

      // ═══════════════════════════════════════════════════
      // UNDO/REDO (05_undo_redo.md)
      // ═══════════════════════════════════════════════════
      
      // Ctrl+Z = Undo
      if (isCtrlOrCmd(e) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z = Redo
      if (isCtrlOrCmd(e) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+Y = Redo (alternative)
      if (isCtrlOrCmd(e) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // ═══════════════════════════════════════════════════
      // SELECTION (03_selection_system.md)
      // ═══════════════════════════════════════════════════
      
      // Ctrl+A = Select All
      if (isCtrlOrCmd(e) && e.key === 'a') {
        e.preventDefault();
        store.selectAll();
        return;
      }

      // Escape = Clear Selection / Close Editor
      if (e.key === 'Escape') {
        e.preventDefault();
        if (store.editingNode) {
          store.closeEditor();
        } else {
          store.clearSelection();
        }
        return;
      }

      // ═══════════════════════════════════════════════════
      // MODE SWITCHING (01_mode_system.md)
      // ═══════════════════════════════════════════════════
      
      if (!isCtrlOrCmd(e) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            store.setMode('DIRECTORY');
            return;
          case '2':
            e.preventDefault();
            store.setMode('DEPENDENCY');
            return;
        }
      }

      // ═══════════════════════════════════════════════════
      // NODE OPERATIONS (04_keyboard_shortcuts.md)
      // ═══════════════════════════════════════════════════
      
      // Tab = Quick Create (Directory mode only)
      if (e.key === 'Tab' && store.canCreate) {
        e.preventDefault();
        store.openCreateDialog();
        return;
      }

      // Delete/Backspace = Delete Selected (Directory mode only)
      if ((e.key === 'Delete' || e.key === 'Backspace') && store.canDelete) {
        e.preventDefault();
        const selectedNodes = store.selectedNodes;
        if (selectedNodes.length > 0) {
          store.openDeleteDialog(selectedNodes);
        }
        return;
      }

      // E = Edit/Inspect Selected Node
      if (e.key === 'e' && !isCtrlOrCmd(e)) {
        e.preventDefault();
        const focusedNode = store.focusedNode;
        if (focusedNode) {
          const node = store.nodes.find(n => n.id === focusedNode);
          if (node?.data?.path) {
            const vscode = window.vscode;
            if (vscode) {
              vscode.postMessage({
                command: 'getFileContent',
                path: node.data.path,
              });
            }
          }
        }
        return;
      }

      // F = Focus/Center on Selected
      if (e.key === 'f' && !isCtrlOrCmd(e)) {
        e.preventDefault();
        if (reactFlow) {
          reactFlow.fitView({ 
            padding: 0.2, 
            duration: 300,
            nodes: store.selectedNodes.length > 0 
              ? store.nodes.filter(n => store.selectedNodes.includes(n.id))
              : undefined,
          });
        }
        return;
      }

      // L = Auto Layout/Arrange
      if (e.key === 'l' && !isCtrlOrCmd(e)) {
        e.preventDefault();
        layoutStore.clearManualPositions();
        layoutStore.setIsArranging(true);
        console.log('[Shortcut] L: Auto Layout');
        // Force layout will be triggered by store change
        setTimeout(() => layoutStore.setIsArranging(false), 500);
        return;
      }

      // Space = Fit View
      if (e.key === ' ') {
        e.preventDefault();
        if (reactFlow) {
          reactFlow.fitView({ padding: 0.2, duration: 300 });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, layoutStore, undo, redo, reactFlow]);
}
