import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '@/components/ui/context-menu';

import { useGraphStore } from '@/store/graphStore';
import { useContextMenuActions } from '@/composables/use_context_menu_actions';
import { 
  FileEdit, 
  Pencil, 
  Copy, 
  CopyPlus, 
  Layers, 
  Trash2, 
  Settings2,
  FolderOpen,
  FolderPlus,
  FilePlus

} from 'lucide-react';

interface NodeContextMenuProps {
  children: React.ReactNode;
  nodeId: string;
}

/**
 * Nuke-style Node Context Menu area.
 * Wraps individual nodes.
 */
export function NodeContextMenu({ children, nodeId }: NodeContextMenuProps) {
  const { mode, selectedNodes, canDelete, canCreate } = useGraphStore();
  const {
    handleCreateNew,

    handleOpenInEditor,
    handleRename,
    handleCopyPath,
    handleDuplicate,
    handleShowDependencies,
    handleDelete,
    handleShowProperties,
  } = useContextMenuActions();

  // Determine which nodes this menu applies to
  const isSelected = selectedNodes.includes(nodeId);
  const targetNodeIds = isSelected ? selectedNodes : [nodeId];
  const isMultiSelect = targetNodeIds.length > 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-background/90 backdrop-blur-xl border-border/50 shadow-2xl">
        
        {/* ═══════════════════════════════════════════ */}
        {/* CREATE SECTION (Directory Mode Only) */}
        {/* ═══════════════════════════════════════════ */}
        {mode === 'DIRECTORY' && !isMultiSelect && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={!canCreate} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                <span>New File/Folder</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => handleCreateNew(nodeId)} className="gap-2">
                  <FilePlus className="w-4 h-4" />
                  <span>New File...</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleCreateNew(nodeId)} className="gap-2">
                  <FolderPlus className="w-4 h-4" />
                  <span>New Folder...</span>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* EDIT & NAVIGATION */}
        {/* ═══════════════════════════════════════════ */}
        {!isMultiSelect && (
          <>
            <ContextMenuItem onClick={() => handleOpenInEditor(nodeId)} className="gap-2">
              <FileEdit className="w-4 h-4" />
              <span>Open in Editor</span>
              <kbd className="ml-auto text-xs opacity-50">Enter</kbd>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => handleRename(nodeId)} className="gap-2">
              <Pencil className="w-4 h-4" />
              <span>Rename</span>
              <kbd className="ml-auto text-xs opacity-50">F2</kbd>
            </ContextMenuItem>
            
            <ContextMenuSeparator />
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* FILE OPERATIONS */}
        {/* ═══════════════════════════════════════════ */}
        <ContextMenuItem onClick={() => handleCopyPath(targetNodeIds)} className="gap-2">
          {isMultiSelect ? <CopyPlus className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{isMultiSelect ? 'Copy Paths' : 'Copy Path'}</span>
          <kbd className="ml-auto text-xs opacity-50">Ctrl+C</kbd>
        </ContextMenuItem>

        {!isMultiSelect && (
          <ContextMenuItem onClick={() => handleDuplicate(nodeId)} className="gap-2">
            <Layers className="w-4 h-4" />
            <span>Duplicate</span>
            <kbd className="ml-auto text-xs opacity-50">Ctrl+D</kbd>
          </ContextMenuItem>
        )}

        {!isMultiSelect && (
          <ContextMenuItem onClick={() => handleShowDependencies(nodeId)} className="gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>Show Dependencies</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* ═══════════════════════════════════════════ */}
        {/* DESTRUCTIVE ACITONS */}
        {/* ═══════════════════════════════════════════ */}
        {/* Only allow delete in Directory mode */}
        {mode === 'DIRECTORY' && (
          <ContextMenuItem 
            onClick={() => handleDelete(targetNodeIds)} 
            disabled={!canDelete}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isMultiSelect ? `Delete ${targetNodeIds.length} items` : 'Delete'}</span>
            <kbd className="ml-auto text-xs opacity-50">Del</kbd>
          </ContextMenuItem>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* PROPERTIES */}
        {/* ═══════════════════════════════════════════ */}
        {!isMultiSelect && (
          <>
             <ContextMenuSeparator />
             <ContextMenuItem onClick={() => handleShowProperties(nodeId)} className="gap-2">
               <Settings2 className="w-4 h-4" />
               <span>Properties</span>
             </ContextMenuItem>
          </>
        )}

      </ContextMenuContent>
    </ContextMenu>
  );
}
