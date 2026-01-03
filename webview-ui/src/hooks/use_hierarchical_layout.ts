import { useCallback } from 'react';
import { type Node, type Edge, Position } from '@xyflow/react';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

export const useHierarchicalLayout = () => {
  const getLayoutedElements = useCallback(
    (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' | 'RL' = 'TB') => {
      dagreGraph.setGraph({ rankdir: direction });

      nodes.forEach((node) => {
        // Use node dimensions if available, otherwise default
        const width = node.measured?.width || node.width || nodeWidth;
        const height = node.measured?.height || node.height || nodeHeight;
        dagreGraph.setNode(node.id, { width, height });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = node.measured?.width || node.width || nodeWidth;
        const height = node.measured?.height || node.height || nodeHeight;
        
        // Handle positions based on direction
        let targetPosition = Position.Top;
        let sourcePosition = Position.Bottom;

        if (direction === 'LR') {
          targetPosition = Position.Left;
          sourcePosition = Position.Right;
        } else if (direction === 'RL') {
          targetPosition = Position.Right;
          sourcePosition = Position.Left;
        }

        return {
          ...node,
          targetPosition,
          sourcePosition,
          // We are shifting the dagre node position (which is center-based)
          // to React Flow node position (which is top-left-based).
          position: {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { getLayoutedElements };
};
