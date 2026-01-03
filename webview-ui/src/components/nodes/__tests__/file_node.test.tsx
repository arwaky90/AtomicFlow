import { render, screen } from '@testing-library/react';
import { FileNode } from '../file_node';
import { describe, it, expect, vi } from 'vitest';


// Mock dependnecies
vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' }
}));

vi.mock('@/store/graphStore', () => ({
  useGraphStore: vi.fn(() => false) // Default: not focused
}));

describe('FileNode', () => {
  const defaultProps = {
    id: '1',
    data: {
      label: 'test.ts',
      lineCount: 100,
      imports: 5,
      exports: 2
    },
    selected: false,
    zIndex: 1,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    xPos: 0,
    yPos: 0,
    type: 'file',
  };

  it('renders correctly with label', () => {
    // @ts-expect-error - simplified props for testing
    render(<FileNode {...defaultProps} />);
    expect(screen.getByText('test.ts')).toBeInTheDocument();
  });

  it('displays metrics when provided', () => {
    // @ts-expect-error - simplified props for testing
    render(<FileNode {...defaultProps} />);
    expect(screen.getByText('100L')).toBeInTheDocument();
    expect(screen.getByText('↓5')).toBeInTheDocument();
    expect(screen.getByText('↑2')).toBeInTheDocument();
  });

  it('applies selected styles', () => {
    // @ts-expect-error - simplified props for testing
    const { container } = render(<FileNode {...defaultProps} selected={true} />);
    const node = container.firstChild;
    expect(node).toHaveClass('border-primary');
  });
});
