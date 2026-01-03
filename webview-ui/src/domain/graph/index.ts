// ============================================================================
// GRAPH DOMAIN MODULE INDEX
// Barrel exports for graph-related domain services
// ============================================================================

// Kingdom Mode
export { 
  detectRole, 
  generateMockMetrics, 
  transformToKingdomNode,
  transformNodesToKingdom,
  type KingdomRole,
  type KingdomMetrics,
} from './kingdom_mode_transformer';

export {
  ROLE_ZONES,
  RING_GROUPS,
  createZoneNode,
  getZoneByRole,
  type ZoneConfig,
  type RingConfig,
} from './kingdom_zone_config';

export {
  groupNodesByRole,
  calculateKingdomLayout,
  // applyKingdomLayout, // Deprecated
  // calculateZoneSize,  // Deprecated
} from './kingdom_layout_service';

export { NODE_TYPES, EDGE_TYPES, DEFAULT_EDGE_OPTIONS, getMinimapNodeColor } from './graph_config';

// Directory Mode
export {
  createParentNode,
  filterChildNodes,
  sortChildren,
  layoutChildren,
  createStructureEdges,
  createDirectoryLayout,
} from './directory_layout_service';
