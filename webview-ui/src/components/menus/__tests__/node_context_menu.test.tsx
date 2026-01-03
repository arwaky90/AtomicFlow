/**
 * Tests for NodeContextMenu component
 * Ensures correct menu items appear based on selection state and mode.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NodeContextMenu } from '../node_context_menu';
import { useGraphStore } from '@/store/graphStore';
import { act } from 'react';

// ═══════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════

// Mock dependencies
const mockVscode = { postMessage: vi.fn() };
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

describe('NodeContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).vscode = mockVscode;
    Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true });
    
    // Reset store
    useGraphStore.setState({
      mode: 'DIRECTORY',
      nodes: [
        { id: 'node-1', type: 'file', position: { x: 0, y: 0 }, data: { path: '/a', label: 'a', type: 'file' } },
        { id: 'node-2', type: 'file', position: { x: 0, y: 0 }, data: { path: '/b', label: 'b', type: 'file' } },
      ],
      selectedNodes: [],
      canCreate: true,
      canDelete: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { vscode?: typeof mockVscode }).vscode;
  });

  // ═══════════════════════════════════════════════════════════════════
  // SINGLE SELECTION TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('Single Node Selection', () => {
    it('should show full set of actions for single node', async () => {
      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        expect(screen.getByText('Open in Editor')).toBeInTheDocument();
        expect(screen.getByText('Rename')).toBeInTheDocument();
        expect(screen.getByText('Copy Path')).toBeInTheDocument();
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
        expect(screen.getByText('Show Dependencies')).toBeInTheDocument();
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });
    });

    it('should show Delete in directory mode', async () => {
      useGraphStore.setState({ mode: 'DIRECTORY' });
      
      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should NOT show Delete in dependency mode', async () => {
      useGraphStore.setState({ mode: 'DEPENDENCY' });
      
      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MULTI SELECTION TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('Multi Node Selection', () => {
    beforeEach(() => {
      useGraphStore.setState({ selectedNodes: ['node-1', 'node-2'] });
    });

    it('should show limited actions for multi selection', async () => {
      // Pass one of the selected nodes
      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        // Should show
        expect(screen.getByText('Copy Paths')).toBeInTheDocument();
        expect(screen.getByText(/Delete 2 items/)).toBeInTheDocument();

        // Should NOT show
        expect(screen.queryByText('Open in Editor')).not.toBeInTheDocument();
        expect(screen.queryByText('Rename')).not.toBeInTheDocument();
        expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
        expect(screen.queryByText('Properties')).not.toBeInTheDocument();
      });
    });

    it('should NOT show New File/Folder submenu in multi select', async () => {
      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        expect(screen.queryByText('New File/Folder')).not.toBeInTheDocument();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACTION TRIGGER TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe('Action Triggers', () => {
    it('should trigger Open in Editor', async () => {
      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Open in Editor'));
      });

      expect(mockVscode.postMessage).toHaveBeenCalledWith({
        command: 'openFile',
        path: '/a'
      });
    });

    it('should trigger Delete with multiple items', async () => {
      useGraphStore.setState({ selectedNodes: ['node-1', 'node-2'] });

      render(
        <NodeContextMenu nodeId="node-1">
          <div data-testid="node">Node</div>
        </NodeContextMenu>
      );

      await act(async () => {
        fireEvent.contextMenu(screen.getByTestId('node'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Delete 2 items/));
      });

      const state = useGraphStore.getState();
      expect(state.isDeleteDialogOpen).toBe(true);
      expect(state.nodesToDelete).toEqual(['node-1', 'node-2']);
    });
  });
});
