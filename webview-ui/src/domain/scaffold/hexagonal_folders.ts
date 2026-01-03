/**
 * Hexagonal Architecture Folder Structure
 * Defines the 12 required folders for Kingdom mode
 */

export interface HexFolderConfig {
  path: string;
  role: string;
  emoji: string;
  description: string;
}

/** 12 Required Hexagonal Folders */
export const HEXAGONAL_FOLDERS: HexFolderConfig[] = [
  // Ring 1: Domain Layer
  { path: 'domain/core', role: 'core', emoji: '🏰', description: 'Core business logic' },
  { path: 'domain/entities', role: 'entity', emoji: '📜', description: 'Business entities' },
  { path: 'domain/value_objects', role: 'value_object', emoji: '💎', description: 'Immutable value objects' },
  { path: 'domain/modules', role: 'factory', emoji: '🏭', description: 'Domain modules/factories' },
  { path: 'domain/ports', role: 'port', emoji: '🛡️', description: 'Port interfaces' },
  
  // Ring 2: Application Layer
  { path: 'composables', role: 'composable', emoji: '🔧', description: 'Reusable composables/hooks' },
  
  // Ring 3: Interface Adapters
  { path: 'components', role: 'component', emoji: '🏛️', description: 'UI components' },
  { path: 'adapters/driving', role: 'driving', emoji: '👋', description: 'Driving adapters (controllers)' },
  { path: 'adapters/driven', role: 'driven', emoji: '🚢', description: 'Driven adapters (repositories)' },
  
  // Ring 4: Resources
  { path: 'assets', role: 'assets', emoji: '📦', description: 'Static assets' },
  { path: 'styles', role: 'styles', emoji: '🎨', description: 'CSS/styling files' },
  { path: 'utils', role: 'utils', emoji: '👁️', description: 'Utility functions' },
];

/** Get all folder paths */
export function getHexFolderPaths(): string[] {
  return HEXAGONAL_FOLDERS.map(f => f.path);
}
