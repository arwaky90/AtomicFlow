/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

export function useForceLayout({ nodes, edges, setNodes }: { 
    nodes: Node[], 
    edges: Edge[], 
    setNodes: (nodes: Node[] | ((n: Node[]) => Node[])) => void 
  }) {
  const simulationRef = useRef<any>(null); // Keeping as any for d3 complexity or define correct type if possible
  const nodesRef = useRef<Node[]>(nodes);
  
  // Update ref when nodes change size/count, but avoid infinite loop
  useEffect(() => {
      nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    // Only initialize if we have nodes and no simulation running (or nodes changed significantly)
    const d3Nodes = nodes.map((n) => ({ 
        ...n, 
        x: n.position.x || 0, 
        y: n.position.y || 0 
    }));
    
    // Map edges to D3 links (source/target must be objects or IDs)
    // D3 mutates links to replace IDs with object references if allowed, 
    // but here we just use IDs and forceLink helper.
    const d3Links = edges.map((e) => ({ source: e.source, target: e.target }));

    if (!simulationRef.current) {
        simulationRef.current = forceSimulation(d3Nodes as any)
          .force('charge', forceManyBody().strength(-300))
          .force('link', forceLink(d3Links).id((d: any) => d.id).distance(100))
          .force('center', forceCenter(0, 0)) // Center at 0,0
          .force('collide', forceCollide().radius(50))
          .on('tick', () => {
             // Sync D3 positions to React Flow Nodes
             setNodes((prevNodes: Node[]) => {
                return prevNodes.map((node) => {
                    const d3Node = d3Nodes.find((d) => d.id === node.id);
                    if (!d3Node) return node;

                    return {
                        ...node,
                        position: { x: (d3Node as any).x, y: (d3Node as any).y }
                    };
                });
             });
          });
    } else {
        // Update simulation data
        // For simple re-init, we might just stop and restart if nodes count diff
        simulationRef.current.nodes(d3Nodes);
        simulationRef.current.force('link').links(d3Links);
        simulationRef.current.alpha(1).restart();
    }

    return () => {
        simulationRef.current?.stop();
    };
  }, [nodes.length, edges.length]); // Re-run when graph topology changes
}
