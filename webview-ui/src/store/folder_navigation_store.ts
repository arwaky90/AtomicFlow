import { create } from 'zustand';

interface FolderNavigationState {
  /** Auto-detected source root from backend (e.g., /path/to/project/src) */
  sourceRoot: string;
  /** Workspace root from backend */
  workspaceRoot: string;
  /** Display name of source root (e.g., "src") */
  sourceRootName: string;
  /** Currently expanded/active folder path (relative to sourceRoot) */
  currentFolder: string;
  /** Breadcrumb history stack */
  folderStack: string[];
  /** Set of expanded folders (for tree view) */
  expandedFolders: Set<string>;
  /** Callback to navigate back to Dashboard (set from App.tsx) */
  goToDashboard: (() => void) | null;

  // Actions
  setSourceRoot: (sourceRoot: string, workspaceRoot: string, name: string) => void;
  setGoToDashboard: (callback: () => void) => void;
  navigateInto: (folderPath: string) => void;
  navigateUp: () => void;
  navigateTo: (folderPath: string) => void;
  toggleExpand: (folderPath: string) => void;
  isPathAllowed: (path: string) => boolean;
  reset: () => void;
}

export const useFolderStore = create<FolderNavigationState>((set, get) => ({
  sourceRoot: '',
  workspaceRoot: '',
  sourceRootName: 'src',
  currentFolder: '',
  folderStack: [],
  expandedFolders: new Set<string>(),
  goToDashboard: null,

  setGoToDashboard: (callback: () => void) => {
    set({ goToDashboard: callback });
  },

  setSourceRoot: (sourceRoot: string, workspaceRoot: string, name: string) => {
    set({
      sourceRoot,
      workspaceRoot,
      sourceRootName: name,
      // Initialize currentFolder to sourceRoot so Directory mode shows root files
      currentFolder: sourceRoot,
      folderStack: [sourceRoot],
      expandedFolders: new Set<string>([sourceRoot]),
    });
  },

  navigateInto: (folderPath: string) => {
    const { currentFolder, folderStack, expandedFolders } = get();
    
    // Add current to stack and set new folder
    const newStack = [...folderStack, folderPath];
    const newExpanded = new Set(expandedFolders);
    newExpanded.add(folderPath);
    
    // Collapse previous folder
    newExpanded.delete(currentFolder);
    
    set({
      currentFolder: folderPath,
      folderStack: newStack,
      expandedFolders: newExpanded,
    });
  },

  navigateUp: () => {
    const { folderStack, expandedFolders } = get();
    
    if (folderStack.length <= 1) return; // Can't go above root
    
    const newStack = folderStack.slice(0, -1);
    const newFolder = newStack[newStack.length - 1];
    const newExpanded = new Set(expandedFolders);
    
    // Collapse current, expand parent
    newExpanded.delete(get().currentFolder);
    newExpanded.add(newFolder);
    
    set({
      currentFolder: newFolder,
      folderStack: newStack,
      expandedFolders: newExpanded,
    });
  },

  navigateTo: (folderPath: string) => {
    const { folderStack, sourceRoot } = get();
    
    // If empty path, reset to source root
    if (!folderPath || folderPath === '') {
      set({
        currentFolder: sourceRoot,
        folderStack: [sourceRoot],
        expandedFolders: new Set([sourceRoot]),
      });
      return;
    }
    
    // Find folder in stack, or create new path
    const index = folderStack.indexOf(folderPath);
    
    if (index !== -1) {
      // Navigate back to existing folder in stack
      const newStack = folderStack.slice(0, index + 1);
      const newExpanded = new Set<string>();
      newExpanded.add(folderPath);
      
      set({
        currentFolder: folderPath,
        folderStack: newStack,
        expandedFolders: newExpanded,
      });
    } else {
      // Navigate to new folder (reset stack)
      set({
        currentFolder: folderPath,
        folderStack: [folderPath],
        expandedFolders: new Set([folderPath]),
      });
    }
  },

  toggleExpand: (folderPath: string) => {
    const { expandedFolders } = get();
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    
    set({ expandedFolders: newExpanded });
  },

  /** Check if path is within the sandboxed source root */
  isPathAllowed: (path: string): boolean => {
    const { sourceRoot } = get();
    if (!sourceRoot) return true; // Allow if not initialized yet
    // Simple check: path should not contain ../ or be absolute
    return !path.includes('../') && !path.startsWith('/');
  },

  reset: () => {
    set({
      currentFolder: '',
      folderStack: [],
      expandedFolders: new Set<string>(),
    });
  },
}));
