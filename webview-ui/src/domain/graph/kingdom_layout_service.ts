import type { GraphNode } from '@/store/graphStore';
import type { KingdomRole } from './kingdom_mode_transformer';
import { 
  ROLE_ZONES, 
  RING_GROUPS, 
  createZoneNode, 
  type ZoneConfig 
} from './kingdom_zone_config';

// ============================================================================
// KINGDOM LAYOUT SERVICE
// Positions nodes within their respective role zones and zones within rings
// ============================================================================

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const GAP = 25;
const PADDING = 60; // Padding inside zones
const ZONE_GAP = 50; // Gap between zones
const RING_GAP = 100; // Gap between rings
const MIN_ZONE_WIDTH = 250;
const MIN_ZONE_HEIGHT = 150;

/** Computed Layout Data Intermediate Structures */
interface RoleLayout {
  role: KingdomRole;
  config: ZoneConfig;
  width: number;
  height: number;
  nodes: GraphNode[]; // Nodes with relative positions
}



/** Group nodes by role */
export function groupNodesByRole(nodes: GraphNode[]): Map<KingdomRole, GraphNode[]> {
  const groups = new Map<KingdomRole, GraphNode[]>();
  
  // Initialize all known roles with empty arrays to ensure all zones appear
  Object.keys(ROLE_ZONES).forEach(role => {
    groups.set(role as KingdomRole, []);
  });
  
  nodes.forEach(node => {
    if (node.type === 'zone' || node.type === 'ring') return;
    
    const role = (node.data?.role as KingdomRole) || 'default';
    if (!groups.has(role)) {
        // Fallback for unknown roles
        if (!groups.has('default')) groups.set('default', []);
        groups.get('default')!.push(node);
    } else {
        groups.get(role)!.push(node);
    }
  });
  
  return groups;
}

/** 
 * Calculate layout for a single role zone (nodes inside) 
 * Returns size and nodes with relative positions (x,y from 0,0)
 */
function layoutRoleZone(role: KingdomRole, nodes: GraphNode[]): RoleLayout {
  const config = ROLE_ZONES[role] || ROLE_ZONES.default;
  const count = nodes.length;

  if (count === 0) {
    return {
      role,
      config,
      width: config.width || MIN_ZONE_WIDTH, // Use default or config min
      height: config.height || MIN_ZONE_HEIGHT,
      nodes: []
    };
  }

  // Calculate dynamic grid cell size based on largest node in this zone
  // This prevents overlaps if some nodes are 'King' tier (300px)
  const maxNodeW = Math.max(NODE_WIDTH, ...nodes.map(n => n.width ?? NODE_WIDTH));
  const maxNodeH = Math.max(NODE_HEIGHT, ...nodes.map(n => n.height ?? NODE_HEIGHT));

  // Smart grid calculation: aim for aspect ratio roughly 2:1
  const preferredCols = Math.ceil(Math.sqrt(count * 2)); 
  const maxCols = 5;
  const cols = Math.min(preferredCols, maxCols);
  
  const width = Math.max(
    MIN_ZONE_WIDTH, 
    (cols * maxNodeW) + ((cols - 1) * GAP) + (PADDING * 2)
  );
  
  // Layout nodes relative to local (0,0) of the zone content area
  const relativeNodes = nodes.map((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    
    // Center the node within its grid cell if it's smaller than max
    // or just top-left align? Top-left is safer for simple grid.
    const offsetX = (maxNodeW - (node.width || NODE_WIDTH)) / 2;
    const offsetY = (maxNodeH - (node.height || NODE_HEIGHT)) / 2;

    return {
      ...node,
      position: {
        x: PADDING + col * (maxNodeW + GAP) + offsetX,
        y: PADDING + 40 + row * (maxNodeH + GAP) + offsetY, // +40 for label
      },
      // Important: parentId will be set in the final assembly
      extent: 'parent', 
    } as GraphNode;
  });

  const lastRow = Math.floor((count - 1) / cols);
  const height = Math.max(
    MIN_ZONE_HEIGHT,
    PADDING + 40 + (lastRow + 1) * (maxNodeH + GAP) + PADDING
  );

  return {
    role,
    config,
    width,
    height,
    nodes: relativeNodes
  };
}

/**
 * Main Layout Function
 */
export function calculateKingdomLayout(nodes: GraphNode[]): GraphNode[] {
  // 1. Group nodes
  const groups = groupNodesByRole(nodes);
  
  // 2. Calculate Role Zone Layouts (Size & Inner Node Positions)
  const roleLayouts: RoleLayout[] = [];
  groups.forEach((nodeList, role) => {
    roleLayouts.push(layoutRoleZone(role, nodeList));
  });

  // 3. Group Role Zones by Ring
  const ringGroups = new Map<number, RoleLayout[]>();
  // Initialize rings 1-4
  [1, 2, 3, 4].forEach(r => ringGroups.set(r, []));
  
  roleLayouts.forEach(rl => {
    const ringId = rl.config.ring || 0;
    if (ringGroups.has(ringId)) {
      ringGroups.get(ringId)!.push(rl);
    } // else ignore (default, or handle ring 0?)
  });

  // 4. Calculate Ring Layouts (Layout Zones horizontally inside Rings)
  const finalNodes: GraphNode[] = [];
  
  // Order rings for vertical stacking: 4 -> 3 -> 2 -> 1
  const ringOrder = [4, 3, 2, 1];
  let currentY = 0;

  ringOrder.forEach(ringNum => {
    const ringConfigRaw = RING_GROUPS.find(r => r.id.includes(`ring-${ringNum}`));
    if (!ringConfigRaw) return;

    const zonesInRing = ringGroups.get(ringNum) || [];
    
    // Sort zones by some logic? E.g. alphabetical or hardcoded specific order per ring?
    // Using default order from Object.keys might be random.
    // Let's rely on the order they were pushed/defined implies importance.
    // Ideally we want specific zones (e.g. Core) in center.
    // Simple approach: Just layout line for now.
    
    let currentX = PADDING;
    let maxRowHeight = MIN_ZONE_HEIGHT;
    
    // Calculate Ring Size
    // Positions of Zones inside Ring
    const zonePositions = zonesInRing.map(zoneLayout => {
       const pos = { x: currentX, y: PADDING + 40 }; // +40 for Ring Label
       currentX += zoneLayout.width + ZONE_GAP;
       maxRowHeight = Math.max(maxRowHeight, zoneLayout.height);
       return { layout: zoneLayout, pos };
    });
    
    const ringWidth = Math.max(currentX - ZONE_GAP + PADDING, 800); // Min width for aesthetics
    const ringHeight = maxRowHeight + PADDING * 2 + 40;

    // Create Ring Node
    const ringNode = createZoneNode(
      ringConfigRaw,
      0, // X centered later? Or just 0.
      currentY,
      ringWidth,
      ringHeight
    );
    finalNodes.push(ringNode);

    // Create Zone Nodes & File Nodes
    zonePositions.forEach(({ layout, pos }) => {
      // Create Role Zone Node
      const zoneNode = createZoneNode(
        layout.config,
        pos.x,
        pos.y,
        layout.width,
        layout.height,
        ringNode.id // Parent is Ring
      );
      finalNodes.push(zoneNode);

      // Add File Nodes (parented to Zone)
      layout.nodes.forEach(fileNode => {
        finalNodes.push({
          ...fileNode,
          parentId: zoneNode.id
        });
      });
    });

    currentY += ringHeight + RING_GAP;
  });

  return finalNodes;
}

// Export groupNodesByRole for compatibility if needed elsewhere

