import type { GraphNode } from '@/store/graphStore';
import type { KingdomRole } from './kingdom_mode_transformer';

// ============================================================================
// KINGDOM ZONE CONFIG - 12 Role Zones + 4 Ring Groups
// ============================================================================

/** Zone configuration */
export interface ZoneConfig {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  ring: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ring group configuration */
export interface RingConfig {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Brighter ring group backgrounds
// Note: Dimensions (x, y, width, height) are placeholders and will be calculated dynamically
export const RING_GROUPS: RingConfig[] = [
  // Ring 4: Resources (TOP - Blue)
  {
    id: 'ring-4-resources',
    label: 'Ring 4: Resources',
    color: '#60A5FA',
    bgColor: 'rgba(96, 165, 250, 0.08)',
    x: 0, y: 0, 
    width: 0, height: 0,
  },
  // Ring 3: Interface Adapters (Green)
  {
    id: 'ring-3-interface',
    label: 'Ring 3: Interface Adapters',
    color: '#34D399',
    bgColor: 'rgba(52, 211, 153, 0.08)',
    x: 0, y: 0,
    width: 0, height: 0,
  },
  // Ring 2: Application (Red)
  {
    id: 'ring-2-application',
    label: 'Ring 2: Application Rules',
    color: '#F87171',
    bgColor: 'rgba(248, 113, 113, 0.08)',
    x: 0, y: 0,
    width: 0, height: 0,
  },
  // Ring 1: Domain (Gold)
  {
    id: 'ring-1-domain',
    label: 'Ring 1: Enterprise Rules',
    color: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.08)',
    x: 0, y: 0,
    width: 0, height: 0,
  },
];

// 12 Role Zones with brighter colors
export const ROLE_ZONES: Record<KingdomRole, ZoneConfig> = {
  // Ring 4: Resources
  assets: {
    id: 'zone-assets', label: 'Assets', emoji: '📦',
    color: '#94A3B8', bgColor: 'rgba(148, 163, 184, 0.15)',
    ring: 4, x: 0, y: 0, width: 0, height: 0,
  },
  utils: {
    id: 'zone-utils', label: 'Utils', emoji: '👁️',
    color: '#2DD4BF', bgColor: 'rgba(45, 212, 191, 0.15)',
    ring: 4, x: 0, y: 0, width: 0, height: 0,
  },
  styles: {
    id: 'zone-styles', label: 'Styles', emoji: '🎨',
    color: '#F472B6', bgColor: 'rgba(244, 114, 182, 0.15)',
    ring: 4, x: 0, y: 0, width: 0, height: 0,
  },

  // Ring 3: Interface Adapters
  driven: {
    id: 'zone-driven', label: 'Driven', emoji: '🚢',
    color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.15)',
    ring: 3, x: 0, y: 0, width: 0, height: 0,
  },
  driving: {
    id: 'zone-driving', label: 'Driving', emoji: '👋',
    color: '#4ADE80', bgColor: 'rgba(74, 222, 128, 0.15)',
    ring: 3, x: 0, y: 0, width: 0, height: 0,
  },
  component: {
    id: 'zone-component', label: 'Component', emoji: '🏛️',
    color: '#22D3EE', bgColor: 'rgba(34, 211, 238, 0.15)',
    ring: 3, x: 0, y: 0, width: 0, height: 0,
  },

  // Ring 2: Application
  port: {
    id: 'zone-port', label: 'Port', emoji: '🛡️',
    color: '#F87171', bgColor: 'rgba(248, 113, 113, 0.15)',
    ring: 2, x: 0, y: 0, width: 0, height: 0,
  },
  composable: {
    id: 'zone-composable', label: 'Composable', emoji: '🔧',
    color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.15)',
    ring: 2, x: 0, y: 0, width: 0, height: 0,
  },

  // Ring 1: Domain (Enterprise Rules)
  core: {
    id: 'zone-core', label: 'Core', emoji: '🏰',
    color: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.2)',
    ring: 1, x: 0, y: 0, width: 0, height: 0,
  },
  entity: {
    id: 'zone-entity', label: 'Entity', emoji: '📜',
    color: '#FB923C', bgColor: 'rgba(251, 146, 60, 0.15)',
    ring: 1, x: 0, y: 0, width: 0, height: 0,
  },
  factory: {
    id: 'zone-factory', label: 'Factory', emoji: '🏭',
    color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)',
    ring: 1, x: 0, y: 0, width: 0, height: 0,
  },
  value_object: {
    id: 'zone-value', label: 'Value', emoji: '💎',
    color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.15)',
    ring: 1, x: 0, y: 0, width: 0, height: 0,
  },

  // Default fallback
  default: {
    id: 'zone-default', label: 'Other', emoji: '❓',
    color: '#71717A', bgColor: 'rgba(113, 113, 122, 0.1)',
    ring: 0, x: 0, y: 0, width: 0, height: 0,
  },
};

/**
 * Helper to construct a Zone Node from config and dimensions
 */
export function createZoneNode(
  config: ZoneConfig | RingConfig, 
  x: number, 
  y: number, 
  width: number, 
  height: number,
  parentId?: string
): GraphNode {
  // Check if config is ZoneConfig (has ring) or RingConfig
  const isZone = 'ring' in config;
  const emoji = 'emoji' in config ? config.emoji : '';

  return {
    id: config.id,
    type: 'zone',
    position: { x, y },
    width,
    height,
    zIndex: isZone ? -50 : -100, // Role zones higher than Rings
    selectable: true,
    draggable: true, // Enable dragging
    parentId, // Hierarchical parent logic
    extent: 'parent',
    data: {
      label: emoji ? `${emoji} ${config.label}` : config.label,
      type: isZone ? 'zone' : 'ring',
      color: config.color,
      bgColor: config.bgColor,
      width,
      height,
    },
  };
}

/**
 * Get zone config by role
 */
export function getZoneByRole(role: KingdomRole): ZoneConfig {
  return ROLE_ZONES[role] || ROLE_ZONES.default;
}
