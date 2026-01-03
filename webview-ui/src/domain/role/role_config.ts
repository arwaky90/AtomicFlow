/**
 * Role Configuration - 12 Hexagonal Architecture Roles
 * Format: emoji + role name (no kingdom terminology)
 */

export interface RoleOption {
  key: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  ring: number;
}

/** 12 Hexagonal Architecture Roles */
export const ROLE_OPTIONS: RoleOption[] = [
  // === Ring 1: Domain Layer ===
  { key: 'core',         label: 'Core',          emoji: '🏰', color: 'text-yellow-400',  bgColor: 'bg-yellow-500/10', ring: 1 },
  { key: 'entity',       label: 'Entity',        emoji: '📜', color: 'text-orange-400',  bgColor: 'bg-orange-500/10', ring: 1 },
  { key: 'value_object', label: 'Value Object',  emoji: '💎', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', ring: 1 },
  { key: 'factory',      label: 'Factory',       emoji: '🏭', color: 'text-amber-400',   bgColor: 'bg-amber-500/10',  ring: 1 },
  
  // === Ring 2: Application Layer ===
  { key: 'port',         label: 'Port',          emoji: '🛡️', color: 'text-red-400',     bgColor: 'bg-red-500/10',    ring: 2 },
  { key: 'composable',   label: 'Composable',    emoji: '🔧', color: 'text-purple-400',  bgColor: 'bg-purple-500/10', ring: 2 },
  
  // === Ring 3: Interface Adapters ===
  { key: 'component',    label: 'Component',     emoji: '🏛️', color: 'text-cyan-400',    bgColor: 'bg-cyan-500/10',   ring: 3 },
  { key: 'driving',      label: 'Driving',       emoji: '👋', color: 'text-green-400',   bgColor: 'bg-green-500/10',  ring: 3 },
  { key: 'driven',       label: 'Driven',        emoji: '🚢', color: 'text-blue-400',    bgColor: 'bg-blue-500/10',   ring: 3 },
  
  // === Ring 4: Resources ===
  { key: 'assets',       label: 'Assets',        emoji: '📦', color: 'text-slate-400',   bgColor: 'bg-slate-500/10',  ring: 4 },
  { key: 'styles',       label: 'Styles',        emoji: '🎨', color: 'text-pink-400',    bgColor: 'bg-pink-500/10',   ring: 4 },
  { key: 'utils',        label: 'Utils',         emoji: '👁️', color: 'text-teal-400',    bgColor: 'bg-teal-500/10',   ring: 4 },
  
  // Fallback
  { key: 'default',      label: 'Unclassified',  emoji: '❓', color: 'text-zinc-400',    bgColor: 'bg-zinc-400/10',   ring: 0 },
];

/** Map for quick role lookup */
export const ROLE_MAP = Object.fromEntries(ROLE_OPTIONS.map(r => [r.key, r]));

/** Get roles grouped by ring */
export function getRolesByRing(ring: number): RoleOption[] {
  return ROLE_OPTIONS.filter(r => r.ring === ring);
}

/**
 * Determine hexagonal role from file path
 */
export function getRoleFromPath(path: string): string {
  if (!path) return 'default';
  const lower = path.toLowerCase();
  
  // Ring 1: Domain Layer
  if (lower.includes('/core/') || (lower.includes('domain') && lower.includes('index'))) return 'core';
  if (lower.includes('/store/') || lower.includes('entities')) return 'entity';
  if (lower.includes('value_object') || lower.includes('types')) return 'value_object';
  if (lower.includes('/domain/') && !lower.includes('index')) return 'factory';
  
  // Ring 2: Application Layer
  if (lower.includes('port')) return 'port';
  if (lower.includes('composable') || lower.includes('/hooks/')) return 'composable';
  
  // Ring 3: Interface Adapters
  if (lower.includes('/panels/') || lower.includes('/dialogs/')) return 'driving';
  if (lower.includes('/edges/') || lower.includes('adapter')) return 'driven';
  if (lower.includes('/components/') || lower.includes('/ui/')) return 'component';
  
  // Ring 4: Resources
  if (lower.includes('/assets/')) return 'assets';
  if (lower.includes('/styles/') || lower.includes('.css')) return 'styles';
  if (lower.includes('/lib/') || lower.includes('/utils/')) return 'utils';
  
  return 'default';
}
