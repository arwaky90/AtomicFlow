import { create } from 'zustand';

export type LayoutMode = 'force' | 'hierarchical' | 'manual';

interface LayoutState {
  /** Current layout algorithm mode */
  layoutMode: LayoutMode;
  /** Whether auto-arrange is in progress */
  isArranging: boolean;
  /** User-saved manual positions (nodeId -> {x, y}) */
  manualPositions: Map<string, { x: number; y: number }>;

  // Actions
  setLayoutMode: (mode: LayoutMode) => void;
  setIsArranging: (arranging: boolean) => void;
  saveManualPosition: (nodeId: string, position: { x: number; y: number }) => void;
  clearManualPositions: () => void;
  getManualPosition: (nodeId: string) => { x: number; y: number } | undefined;
  
  /** Positions calculated by the layout algorithm */
  computedPositions: Map<string, { x: number; y: number }>;
  setComputedPositions: (positions: Map<string, { x: number; y: number }>) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  layoutMode: 'hierarchical',
  isArranging: false,
  manualPositions: new Map(),

  setLayoutMode: (mode: LayoutMode) => set({ layoutMode: mode }),

  setIsArranging: (arranging: boolean) => set({ isArranging: arranging }),

  saveManualPosition: (nodeId: string, position: { x: number; y: number }) => {
    const { manualPositions } = get();
    const newPositions = new Map(manualPositions);
    newPositions.set(nodeId, position);
    set({ 
      manualPositions: newPositions,
      layoutMode: 'manual', // Switch to manual mode when user drags
    });
  },

  clearManualPositions: () => {
    set({ 
      manualPositions: new Map(),
      layoutMode: 'hierarchical', // Reset to auto layout
    });
  },

  getManualPosition: (nodeId: string) => {
    return get().manualPositions.get(nodeId);
  },

  /** Positions calculated by the layout algorithm (read-only for consumers) */
  computedPositions: new Map(),
  setComputedPositions: (positions: Map<string, { x: number; y: number }>) => set({ computedPositions: positions }),
}));
