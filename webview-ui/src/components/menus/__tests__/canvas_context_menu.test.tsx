/**
 * Tests for CanvasContextMenu component
 * Ensures the UI renders correctly and interactions trigger proper actions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanvasContextMenu } from '../canvas_context_menu';
import { useGraphStore } from '@/store/graphStore';
import { useLayoutStore } from '@/store/layout_store';
import { act } from 'react';

// ═══════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════

// Mock window.vscode
const mockVscode = {
  postMessage: vi.fn(),
};

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
};

describe('CanvasContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup window.vscode
    // Setup window.vscode with correct type casting
    // We strictly type it as any here to bypass the VsCodeApi interaction in tests
    // or we can extend the type correctly if we import it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).vscode = mockVscode;
    
    // Setup clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });
    
    // Reset store to DIRECTORY mode (default)
    useGraphStore.setState({
      mode: 'DIRECTORY',
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      focusedNode: null,
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
  // RENDER TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('rendering', () => {
    it('should render children correctly', () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas-content">Canvas Content</div>
        </CanvasContextMenu>
      );

      expect(screen.getByTestId('canvas-content')).toBeInTheDocument();
    });

    it('should show context menu on right click', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas-content">Canvas Content</div>
        </CanvasContextMenu>
      );

      const content = screen.getByTestId('canvas-content');
      
      await act(async () => {
        fireEvent.contextMenu(content);
      });

      // Wait for menu to appear
      await waitFor(() => {
        expect(screen.getByText('Find Dependencies')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DIRECTORY MODE TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('DIRECTORY mode', () => {
    beforeEach(() => {
      useGraphStore.setState({ 
        mode: 'DIRECTORY',
        canCreate: true 
      });
    });

    it('should show "New File/Folder" submenu in DIRECTORY mode', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('New File/Folder')).toBeInTheDocument();
      });
    });

    it('should have enabled submenu when canCreate is true', async () => {
      useGraphStore.setState({ canCreate: true });

      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        const submenuTrigger = screen.getByText('New File/Folder');
        expect(submenuTrigger.closest('[data-disabled]')).toBeNull();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DEPENDENCY MODE TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('DEPENDENCY mode', () => {
    beforeEach(() => {
      useGraphStore.setState({ mode: 'DEPENDENCY' });
    });

    it('should NOT show "New File/Folder" submenu in DEPENDENCY mode', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Find Dependencies')).toBeInTheDocument();
      });

      // New File/Folder should NOT be present
      expect(screen.queryByText('New File/Folder')).not.toBeInTheDocument();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MENU ITEM TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('menu items', () => {
    it('should show Find Dependencies item', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Find Dependencies')).toBeInTheDocument();
      });
    });

    it('should show Arrange All item with keyboard shortcut', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Arrange All')).toBeInTheDocument();
        expect(screen.getByText('L')).toBeInTheDocument();
      });
    });

    it('should show Refresh View item with F5 shortcut', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh View')).toBeInTheDocument();
        expect(screen.getByText('F5')).toBeInTheDocument();
      });
    });

    it('should show Paste item with Ctrl+V shortcut', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Paste')).toBeInTheDocument();
        expect(screen.getByText('Ctrl+V')).toBeInTheDocument();
      });
    });

    it('should show Select All item with Ctrl+A shortcut', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
        expect(screen.getByText('Ctrl+A')).toBeInTheDocument();
      });
    });

    it('should show Undo item with Ctrl+Z shortcut', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Undo')).toBeInTheDocument();
        expect(screen.getByText('Ctrl+Z')).toBeInTheDocument();
      });
    });

    it('should show Redo item with Ctrl+Y shortcut', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Redo')).toBeInTheDocument();
        expect(screen.getByText('Ctrl+Y')).toBeInTheDocument();
      });
    });

    it('should show Switch Mode submenu', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Switch Mode')).toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACTION TRIGGER TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('action triggers', () => {
    it('should trigger handleArrangeAll on Arrange All click', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Arrange All')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Arrange All'));
      });

      // Verify layoutStore was updated
      const state = useLayoutStore.getState();
      expect(state.isArranging).toBe(true);
    });

    it('should trigger handleFindDependencies on Find Dependencies click', async () => {
      useGraphStore.setState({ mode: 'DIRECTORY' });

      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Find Dependencies')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Find Dependencies'));
      });

      // Verify mode switched
      const state = useGraphStore.getState();
      expect(state.mode).toBe('DEPENDENCY');
    });

    it('should trigger handleRefreshView on Refresh View click', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh View')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Refresh View'));
      });

      // Verify vscode message sent
      expect(mockVscode.postMessage).toHaveBeenCalledWith({
        command: 'refresh',
      });
    });

    it('should trigger handleSelectAll on Select All click', async () => {
      const mockNodes = [
        { id: 'n1', type: 'file', position: { x: 0, y: 0 }, data: { label: 'a', type: 'file' } },
        { id: 'n2', type: 'file', position: { x: 0, y: 0 }, data: { label: 'b', type: 'file' } },
      ];

      useGraphStore.setState({ 
        nodes: mockNodes as ReturnType<typeof useGraphStore.getState>['nodes'],
        selectedNodes: [],
      });

      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Select All'));
      });

      // Verify selection updated
      const state = useGraphStore.getState();
      expect(state.selectedNodes).toContain('n1');
      expect(state.selectedNodes).toContain('n2');
    });

    it('should trigger handlePaste on Paste click', async () => {
      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Paste')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Paste'));
      });

      // Verify clipboard was read
      await waitFor(() => {
        expect(mockClipboard.readText).toHaveBeenCalled();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MODE SWITCH TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('mode switching', () => {
    it.skip('should switch to DEPENDENCY mode via submenu', async () => {
      useGraphStore.setState({ mode: 'DIRECTORY' });

      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Switch Mode')).toBeInTheDocument();
      });

      // Hover over Switch Mode to open submenu
      const switchModeItem = screen.getByText('Switch Mode');
      await act(async () => {
        switchModeItem.focus();
        fireEvent.mouseEnter(switchModeItem);
        fireEvent.mouseMove(switchModeItem);
      });

      // Wait for submenu
      await waitFor(() => {
        expect(screen.getByText('Dependency Mode')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Dependency Mode'));
      });

      const state = useGraphStore.getState();
      expect(state.mode).toBe('DEPENDENCY');
    });

    it.skip('should switch to DIRECTORY mode via submenu', async () => {
      useGraphStore.setState({ mode: 'DEPENDENCY' });

      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Switch Mode')).toBeInTheDocument();
      });

      const switchModeItem = screen.getByText('Switch Mode');
      await act(async () => {
        switchModeItem.focus();
        fireEvent.mouseEnter(switchModeItem);
        fireEvent.mouseMove(switchModeItem);
      });

      await waitFor(() => {
        expect(screen.getByText('Directory Mode')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Directory Mode'));
      });

      const state = useGraphStore.getState();
      expect(state.mode).toBe('DIRECTORY');
    });

    it.skip('Directory Mode should be disabled when already in DIRECTORY mode', async () => {
      useGraphStore.setState({ mode: 'DIRECTORY' });

      render(
        <CanvasContextMenu>
          <div data-testid="canvas">Canvas</div>
        </CanvasContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('canvas'));
      });

      await waitFor(() => {
        expect(screen.getByText('Switch Mode')).toBeInTheDocument();
      });

      const switchModeItem = screen.getByText('Switch Mode');
      await act(async () => {
        switchModeItem.focus();
        fireEvent.mouseEnter(switchModeItem);
        fireEvent.mouseMove(switchModeItem);
      });

      await waitFor(() => {
        const directoryModeItem = screen.getByText('Directory Mode');
        // Check if the item or its parent has disabled state
        expect(directoryModeItem.closest('[data-disabled]')).toBeTruthy();
      });
    });
  });
});
