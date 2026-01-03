/**
 * Graph Types - Core type definitions for the graph system
 * Extracted from graphStore.ts for reusability
 */
import type { Node, Edge } from '@xyflow/react';

/** Frontend graph node with React Flow extensions */
export interface GraphNode extends Node {
  id: string;
  data: { 
    label: string;
    type: string;
    path?: string;
    lineCount?: number;
    imports?: string[];
    exports?: string[];
    [key: string]: unknown;
  };
  path?: string;
}

/** Frontend graph edge with React Flow extensions */
export interface GraphEdge extends Edge {
  source: string;
  target: string;
}

/** Backend node representation (from Rust engine) */
export interface BackendNode {
  id: string;
  name?: string;
  type?: string;
  path?: string;
  node_type?: 'directory' | 'file';
  imports?: string[];
  exports?: string[];
  lineCount?: number;
  [key: string]: unknown;
}

/** Backend link representation (from Rust engine) */
export interface BackendLink {
  source: string;
  target: string;
  weight?: number;
}

/** Transform backend data to frontend format */
export function transformBackendNodes(nodes: BackendNode[]): GraphNode[] {
  return nodes.map((n) => {
    const nodeType = n.node_type === 'directory' ? 'folder' : 'file';
    
    // Debug log in development
    if (import.meta.env.DEV && nodes.length < 20) {
      console.log(`[Transform] ${n.name || n.id} → type: ${nodeType}, node_type: ${n.node_type}`);
    }
    
    return {
      id: n.id,
      position: { x: 0, y: 0 },
      data: { 
        label: n.name || n.id, 
        type: n.type || 'unknown',
        path: n.path as string, 
        ...n,
        ports: {
          inputs: n.imports || [],
          outputs: n.exports || []
        }
      },
      type: nodeType,
      path: n.path as string
    };
  });
}

/** Transform backend links to frontend edges */
export function transformBackendEdges(links: BackendLink[]): GraphEdge[] {
  return links.map((l, i) => ({
    id: `e-${l.source}-${l.target}-${i}`,
    source: l.source,
    target: l.target,
    type: 'dependency',
    data: { weight: l.weight || 1 },
    animated: true,
  }));
}
