/**
 * Tests for useContextMenuActions composable
 * Ensures all context menu actions work correctly with mocked dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContextMenuActions } from '../use_context_menu_actions';
import { useGraphStore } from '@/store/graphStore';
import { useLayoutStore } from '@/store/layout_store';

// ═══════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════

// Mock window.vscode API
const mockVscode = {
  postMessage: vi.fn(),
};

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue('mock-clipboard-content'),
};

// Mock console
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
};

describe('useContextMenuActions', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup window.vscode mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).vscode = mockVscode;
    
    // Setup clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    // Mock console
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    
    // Reset stores to initial state
    useGraphStore.setState({
      mode: 'DIRECTORY',
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      focusedNode: null,
      isCreateDialogOpen: false,
      isDeleteDialogOpen: false,
      nodesToDelete: [],
      creationTargetPath: null,
      canCreate: true,
      canDelete: true,
    });
    
    useLayoutStore.setState({
      isArranging: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { vscode?: typeof mockVscode }).vscode;
  });

  // ═══════════════════════════════════════════════════════════════════
  // CANVAS ACTIONS TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('handleCreateNew', () => {
    it('should call openCreateDialog when in DIRECTORY mode', () => {
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        nodes: [] 
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleCreateNew();
      });

      const state = useGraphStore.getState();
      expect(state.isCreateDialogOpen).toBe(true);
    });

    it('should not open dialog when in DEPENDENCY mode', () => {
      useGraphStore.setState({ 
        mode: 'DEPENDENCY',
        nodes: [] 
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleCreateNew();
      });

      const state = useGraphStore.getState();
      expect(state.isCreateDialogOpen).toBe(false);
    });

    it('should use target folder path when creating inside a folder', () => {
      const mockNodes = [
        {
          id: 'folder-1',
          type: 'folder',
          position: { x: 0, y: 0 },
          data: { 
            path: '/home/user/project/src',
            label: 'src',
            type: 'folder'
          },
        },
      ];
      
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleCreateNew('folder-1');
      });

      const state = useGraphStore.getState();
      expect(state.isCreateDialogOpen).toBe(true);
      expect(state.creationTargetPath).toBe('/home/user/project/src');
    });

    it('should use parent directory when creating from a file node', () => {
      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { 
            path: '/home/user/project/src/index.ts',
            label: 'index.ts',
            type: 'file'
          },
        },
      ];
      
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleCreateNew('file-1');
      });

      const state = useGraphStore.getState();
      expect(state.isCreateDialogOpen).toBe(true);
      expect(state.creationTargetPath).toBe('/home/user/project/src');
    });
  });

  describe('handleFindDependencies', () => {
    it('should switch mode to DEPENDENCY', () => {
      useGraphStore.setState({ mode: 'DIRECTORY' });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleFindDependencies();
      });

      const state = useGraphStore.getState();
      expect(state.mode).toBe('DEPENDENCY');
    });
  });

  describe('handleArrangeAll', () => {
    it('should set isArranging to true in layoutStore', () => {
      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleArrangeAll();
      });

      const state = useLayoutStore.getState();
      expect(state.isArranging).toBe(true);
    });
  });

  describe('handleRefreshView', () => {
    it('should reset node positions and send refresh message to vscode', () => {
      const mockNodes = [
        {
          id: 'node-1',
          type: 'file',
          position: { x: 100, y: 200 },
          data: { label: 'test', type: 'file' },
        },
        {
          id: 'node-2',
          type: 'folder',
          position: { x: 300, y: 400 },
          data: { label: 'folder', type: 'folder' },
        },
      ];

      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes'] 
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleRefreshView();
      });

      // Check positions reset
      const state = useGraphStore.getState();
      state.nodes.forEach(node => {
        expect(node.position).toEqual({ x: 0, y: 0 });
      });

      // Check vscode message sent
      expect(mockVscode.postMessage).toHaveBeenCalledWith({
        command: 'refresh',
      });
    });
  });

  describe('handlePaste', () => {
    it('should read from clipboard and log the content', async () => {
      const { result } = renderHook(() => useContextMenuActions());
      
      await act(async () => {
        await result.current.handlePaste();
      });

      expect(mockClipboard.readText).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[ContextMenu] Paste:',
        'mock-clipboard-content'
      );
    });

    it('should handle clipboard read failure gracefully', async () => {
      mockClipboard.readText.mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() => useContextMenuActions());
      
      await act(async () => {
        await result.current.handlePaste();
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[ContextMenu] Clipboard read failed:',
        expect.any(Error)
      );
    });
  });

  describe('handleSelectAll', () => {
    it('should select all nodes and edges', () => {
      const mockNodes = [
        { id: 'node-1', type: 'file', position: { x: 0, y: 0 }, data: { label: 'a', type: 'file' } },
        { id: 'node-2', type: 'folder', position: { x: 0, y: 0 }, data: { label: 'b', type: 'folder' } },
      ];

      const mockEdges = [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
      ];

      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes'],
        edges: mockEdges as ReturnType<typeof useGraphStore.getState>['edges'],
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleSelectAll();
      });

      const state = useGraphStore.getState();
      expect(state.selectedNodes).toContain('node-1');
      expect(state.selectedNodes).toContain('node-2');
      expect(state.selectedEdges).toContain('edge-1');
    });
  });

  describe('handleUndo', () => {
    it('should call undo from temporal store', () => {
      const undoSpy = vi.spyOn(useGraphStore.temporal.getState(), 'undo');
      
      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleUndo();
      });

      expect(undoSpy).toHaveBeenCalled();
    });
  });

  describe('handleRedo', () => {
    it('should call redo from temporal store', () => {
      const redoSpy = vi.spyOn(useGraphStore.temporal.getState(), 'redo');
      
      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleRedo();
      });

      expect(redoSpy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // NODE ACTIONS TESTS  
  // ═══════════════════════════════════════════════════════════════════

  describe('handleOpenInEditor', () => {
    it('should send openFile message to vscode with correct path', () => {
      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { 
            path: '/home/user/project/src/index.ts',
            label: 'index.ts',
            type: 'file'
          },
        },
      ];
      
      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleOpenInEditor('file-1');
      });

      expect(mockVscode.postMessage).toHaveBeenCalledWith({
        command: 'openFile',
        path: '/home/user/project/src/index.ts',
      });
    });

    it('should not send message if node not found', () => {
      useGraphStore.setState({ nodes: [] });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleOpenInEditor('non-existent');
      });

      expect(mockVscode.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleRename', () => {
    it('should send renameFile message to vscode', () => {
      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { 
            path: '/home/user/project/old-name.ts',
            label: 'old-name.ts',
            type: 'file'
          },
        },
      ];
      
      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleRename('file-1');
      });

      expect(mockVscode.postMessage).toHaveBeenCalledWith({
        command: 'renameFile',
        path: '/home/user/project/old-name.ts',
      });
    });
  });

  describe('handleCopyPath', () => {
    it('should copy single path to clipboard', async () => {
      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { 
            path: '/home/user/project/src/index.ts',
            label: 'index.ts',
            type: 'file'
          },
        },
      ];
      
      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      await act(async () => {
        await result.current.handleCopyPath(['file-1']);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        '/home/user/project/src/index.ts'
      );
    });

    it('should copy multiple paths with newline separator', async () => {
      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { path: '/path/to/file1.ts', label: 'file1.ts', type: 'file' },
        },
        {
          id: 'file-2',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { path: '/path/to/file2.ts', label: 'file2.ts', type: 'file' },
        },
      ];
      
      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      await act(async () => {
        await result.current.handleCopyPath(['file-1', 'file-2']);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        '/path/to/file1.ts\n/path/to/file2.ts'
      );
    });

    it('should handle clipboard write failure gracefully', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Write failed'));

      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { path: '/path/to/file.ts', label: 'file.ts', type: 'file' },
        },
      ];
      
      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      await act(async () => {
        await result.current.handleCopyPath(['file-1']);
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[ContextMenu] Clipboard write failed:',
        expect.any(Error)
      );
    });
  });

  describe('handleDuplicate', () => {
    it('should send duplicateFile message to vscode', () => {
      const mockNodes = [
        {
          id: 'file-1',
          type: 'file',
          position: { x: 0, y: 0 },
          data: { 
            path: '/home/user/project/src/component.tsx',
            label: 'component.tsx',
            type: 'file'
          },
        },
      ];
      
      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes']
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleDuplicate('file-1');
      });

      expect(mockVscode.postMessage).toHaveBeenCalledWith({
        command: 'duplicateFile',
        path: '/home/user/project/src/component.tsx',
      });
    });
  });

  describe('handleShowDependencies', () => {
    it('should focus node, switch to DEPENDENCY mode, and clear selection', () => {
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        selectedNodes: ['other-node'],
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleShowDependencies('target-node');
      });

      const state = useGraphStore.getState();
      expect(state.focusedNode).toBe('target-node');
      expect(state.mode).toBe('DEPENDENCY');
      expect(state.selectedNodes).toEqual([]);
    });
  });

  describe('handleDelete', () => {
    it('should open delete dialog with node IDs in DIRECTORY mode', () => {
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        isDeleteDialogOpen: false,
        nodesToDelete: [],
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleDelete(['node-1', 'node-2']);
      });

      const state = useGraphStore.getState();
      expect(state.isDeleteDialogOpen).toBe(true);
      expect(state.nodesToDelete).toEqual(['node-1', 'node-2']);
    });

    it('should not open delete dialog in DEPENDENCY mode', () => {
      useGraphStore.setState({ 
        mode: 'DEPENDENCY',
        isDeleteDialogOpen: false,
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleDelete(['node-1']);
      });

      const state = useGraphStore.getState();
      expect(state.isDeleteDialogOpen).toBe(false);
    });

    it('should not open delete dialog with empty node IDs', () => {
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        isDeleteDialogOpen: false,
      });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleDelete([]);
      });

      const state = useGraphStore.getState();
      expect(state.isDeleteDialogOpen).toBe(false);
    });
  });

  describe('handleShowProperties', () => {
    it('should set focused node', () => {
      useGraphStore.setState({ focusedNode: null });

      const { result } = renderHook(() => useContextMenuActions());
      
      act(() => {
        result.current.handleShowProperties('node-123');
      });

      const state = useGraphStore.getState();
      expect(state.focusedNode).toBe('node-123');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // STATE ACCESS TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('returned state', () => {
    it('should return current mode', () => {
      useGraphStore.setState({ mode: 'DEPENDENCY' });

      const { result } = renderHook(() => useContextMenuActions());

      expect(result.current.mode).toBe('DEPENDENCY');
    });

    it('should return selected nodes', () => {
      useGraphStore.setState({ selectedNodes: ['a', 'b', 'c'] });

      const { result } = renderHook(() => useContextMenuActions());

      expect(result.current.selectedNodes).toEqual(['a', 'b', 'c']);
    });
  });
});
