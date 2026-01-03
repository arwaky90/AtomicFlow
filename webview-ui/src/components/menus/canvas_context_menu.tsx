import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu';
import { useGraphStore } from '@/store/graphStore';
import { useContextMenuActions } from '@/composables/use_context_menu_actions';
import { 
  FolderPlus, 
  FilePlus, 
  Layout, 
  RefreshCw, 
  Clipboard, 
  CheckSquare,
  Undo2,
  Redo2,
  Search,
  Folder,
  Layers
} from 'lucide-react';

interface CanvasContextMenuProps {
  children: React.ReactNode;
}

/**
 * Nuke-style Canvas Context Menu
 * Right-click on empty canvas to access canvas-level actions.
 */
export function CanvasContextMenu({ children }: CanvasContextMenuProps) {
  const { mode, setMode, canCreate } = useGraphStore();
  const {
    handleCreateNew,
    handleFindDependencies,
    handleArrangeAll,
    handleRefreshView,
    handlePaste,
    handleSelectAll,
    handleUndo,
    handleRedo,
  } = useContextMenuActions();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-background/90 backdrop-blur-xl border-border/50 shadow-2xl">
        
        {/* ═══════════════════════════════════════════ */}
        {/* CREATE SECTION (Directory Mode Only) */}
        {/* ═══════════════════════════════════════════ */}
        {mode === 'DIRECTORY' && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={!canCreate} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                <span>New File/Folder</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => handleCreateNew()} className="gap-2">
                  <FilePlus className="w-4 h-4" />
                  <span>New File...</span>
                  <kbd className="ml-auto text-xs opacity-50">Tab</kbd>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleCreateNew()} className="gap-2">
                  <FolderPlus className="w-4 h-4" />
                  <span>New Folder...</span>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* VIEW & NAVIGATION */}
        {/* ═══════════════════════════════════════════ */}
        <ContextMenuItem onClick={handleFindDependencies} className="gap-2">
          <Search className="w-4 h-4" />
          <span>Find Dependencies</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleArrangeAll} className="gap-2">
          <Layout className="w-4 h-4" />
          <span>Arrange All</span>
          <kbd className="ml-auto text-xs opacity-50">L</kbd>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleRefreshView} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh View</span>
          <kbd className="ml-auto text-xs opacity-50">F5</kbd>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* ═══════════════════════════════════════════ */}
        {/* CLIPBOARD & SELECTION */}
        {/* ═══════════════════════════════════════════ */}
        <ContextMenuItem onClick={handlePaste} className="gap-2">
          <Clipboard className="w-4 h-4" />
          <span>Paste</span>
          <kbd className="ml-auto text-xs opacity-50">Ctrl+V</kbd>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleSelectAll} className="gap-2">
          <CheckSquare className="w-4 h-4" />
          <span>Select All</span>
          <kbd className="ml-auto text-xs opacity-50">Ctrl+A</kbd>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* ═══════════════════════════════════════════ */}
        {/* HISTORY */}
        {/* ═══════════════════════════════════════════ */}
        <ContextMenuItem onClick={handleUndo} className="gap-2">
          <Undo2 className="w-4 h-4" />
          <span>Undo</span>
          <kbd className="ml-auto text-xs opacity-50">Ctrl+Z</kbd>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleRedo} className="gap-2">
          <Redo2 className="w-4 h-4" />
          <span>Redo</span>
          <kbd className="ml-auto text-xs opacity-50">Ctrl+Y</kbd>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* ═══════════════════════════════════════════ */}
        {/* MODE SWITCHER */}
        {/* ═══════════════════════════════════════════ */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Layers className="w-4 h-4" />
            <span>Switch Mode</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem 
              onClick={() => setMode('DIRECTORY')} 
              className="gap-2"
              disabled={mode === 'DIRECTORY'}
            >
              <Folder className="w-4 h-4" />
              <span>Directory Mode</span>
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => setMode('DEPENDENCY')} 
              className="gap-2"
              disabled={mode === 'DEPENDENCY'}
            >
              <Layers className="w-4 h-4" />
              <span>Dependency Mode</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

      </ContextMenuContent>
    </ContextMenu>
  );
}
