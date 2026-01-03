import type { GraphNode } from '@/store/graphStore';

// ============================================================================
// KINGDOM MODE TRANSFORMER
// Responsibility: Role detection & node transformation for Kingdom/Dependency mode
// ============================================================================

/** 12 Kingdom Roles based on Hexagonal Architecture */
export type KingdomRole = 
  | 'core'        // Domain Core (King)
  | 'entity'      // Domain Entity (Law)
  | 'value_object'// Domain Value Object (Treasury)
  | 'factory'     // Domain Module/Factory
  | 'port'        // Application Port (Gatekeeper)
  | 'composable'  // Application Composable (Guild)
  | 'component'   // Interface Component (Town Hall)
  | 'driving'     // Driving Adapter (Reception)
  | 'driven'      // Driven Adapter (Docks)
  | 'assets'      // Resource Assets (Warehouses)
  | 'styles'      // Resource Styles (Gardens)
  | 'utils'       // Resource Utils (Watchtowers)
  | 'default';    // Fallback

/** Metrics for Kingdom node visualization */
export interface KingdomMetrics {
  loc: number;        // Lines of code
  importance: number; // Importance score (0-100)
  size: number;       // Visual size in pixels
}

/**
 * Detect role from file path based on hexagonal architecture patterns.
 * Updated to match actual folder structure in webview-ui/src
 */
export function detectRole(path: string): KingdomRole {
  if (!path) return 'default';
  
  const lowerPath = path.toLowerCase();
  
  // === Domain Layer (Ring 1 - Enterprise Rules) ===
  // Core domain logic
  if (lowerPath.includes('/core/') || lowerPath.includes('/core.')) {
    return 'core';
  }
  // Store/State management = Entity (business state)
  if (lowerPath.includes('/store/') || lowerPath.includes('store.')) {
    return 'entity';
  }
  // Domain logic folders
  if (lowerPath.includes('/domain/')) {
    if (lowerPath.includes('graph') || lowerPath.includes('role')) {
      return 'factory'; // Domain modules
    }
    return 'core';
  }
  
  // === Application Layer (Ring 2 - Application Rules) ===
  // Composables/Hooks = Guild workshops
  if (lowerPath.includes('/composables/') || lowerPath.includes('/hooks/')) {
    return 'composable';
  }
  
  // === Interface Adapters (Ring 3) ===
  // UI Components
  if (lowerPath.includes('/components/')) {
    // Panels = Driving adapters (handle user input)
    if (lowerPath.includes('/panels/')) {
      return 'driving';
    }
    // Dialogs = Driving adapters
    if (lowerPath.includes('/dialogs/')) {
      return 'driving';
    }
    // Nodes = Component (visual representation)
    if (lowerPath.includes('/nodes/')) {
      return 'component';
    }
    // Menus/UI = Component
    if (lowerPath.includes('/menus/') || lowerPath.includes('/ui/')) {
      return 'component';
    }
    // Edges = Infrastructure
    if (lowerPath.includes('/edges/')) {
      return 'driven';
    }
    return 'component';
  }
  
  // === Infrastructure / Driven Adapters ===
  if (lowerPath.includes('/adapters/') || lowerPath.includes('adapter')) {
    return 'driven';
  }
  
  // === Resources (Ring 4) ===
  if (lowerPath.includes('/assets/')) return 'assets';
  if (lowerPath.includes('/styles/') || lowerPath.includes('.css')) return 'styles';
  if (lowerPath.includes('/lib/') || lowerPath.includes('/utils/')) return 'utils';
  
  // === Test files ===
  if (lowerPath.includes('test') || lowerPath.includes('spec')) {
    return 'utils'; // Watchtower (observing code)
  }
  
  return 'default';
}

/**
 * Generate deterministic mock metrics from node ID.
 * Uses hash-like calculation for stable values across sessions.
 */
export function generateMockMetrics(nodeId: string): KingdomMetrics {
  const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const loc = (seed * 123) % 800 + 50;        // Range: 50-850
  const importance = (seed * 456) % 100;       // Range: 0-100
  
  // Size based on importance tier
  let size = 120;
  if (importance > 80) size = 300;       // King tier
  else if (importance > 50) size = 220;  // Noble tier
  else if (importance > 20) size = 160;  // Citizen tier
  
  return { loc, importance, size };
}

/**
 * Transform a standard graph node into a Kingdom node for dependency visualization.
 */
export function transformToKingdomNode(node: GraphNode): GraphNode {
  const path = (node.data?.path as string) || node.path || '';
  const role = detectRole(path);
  const metrics = generateMockMetrics(node.id);
  
  // Debug log for development
  if (import.meta.env.DEV) {
    console.log(`[Kingdom] ${node.data?.label || node.id} → role: ${role}, path: ${path}`);
  }
  
  return {
    ...node,
    type: 'kingdom',
    width: metrics.size,
    height: metrics.size,
    data: {
      ...node.data,
      label: node.data.label || node.id,
      path: path,
      role,
      loc: metrics.loc,
      importance: metrics.importance,
    },
  };
}

/**
 * Batch transform all nodes to Kingdom nodes.
 */
export function transformNodesToKingdom(nodes: GraphNode[]): GraphNode[] {
  return nodes.map(transformToKingdomNode);
}
