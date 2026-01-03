import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, Maximize2, Minimize2 } from 'lucide-react';
import { useGraphStore } from '@/store/graphStore';
import { useFolderStore } from '@/store/folder_navigation_store';
import { NodeContextMenu } from '../menus/node_context_menu';

export interface FolderNodeData extends Record<string, unknown> {
  label: string;
  path?: string;
  childCount?: number;
  isExpanded?: boolean;
  isCurrentCanvas?: boolean;
}

export type FolderNodeType = Node<FolderNodeData, 'folder'>;

const getHandleStyle = (pos: Position) => {
  switch (pos) {
    case Position.Top: return "!top-[-5px] !left-1/2 !-translate-x-1/2";
    case Position.Bottom: return "!bottom-[-5px] !left-1/2 !-translate-x-1/2";
    case Position.Left: return "!left-[-5px] !top-1/2 !-translate-y-1/2";
    case Position.Right: return "!right-[-5px] !top-1/2 !-translate-y-1/2";
  }
};

/** 
 * FolderNode - Expandable group card in Directory mode
 * Acts as a background container for child files
 * Single-click: expand/collapse | Double-click: navigate into
 */
function FolderNodeComponent({ 
  id,
  data, 
  selected,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top
}: NodeProps<FolderNodeType>) {
  const focusedNode = useGraphStore(state => state.focusedNode);
  const isFocused = focusedNode === id;
  const nodeData = data as FolderNodeData;
  
  // Local expanded state for this folder card
  const { expandedFolders, toggleExpand, navigateInto } = useFolderStore();
  const isExpanded = nodeData.isCurrentCanvas || expandedFolders.has(nodeData.path || id);

  // Single click: toggle expand/collapse
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder - clicks are handled elsewhere
  }, []);

  // Double click: navigate into folder
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.path) {
      if (nodeData.isCurrentCanvas) return; // Prevent navigating into self if already header
      navigateInto(nodeData.path);
    }
  }, [nodeData.path, navigateInto, nodeData.isCurrentCanvas]);

  return (
    <NodeContextMenu nodeId={id}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.05, ease: [0.2, 1, 0.3, 1] }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`
          relative
          ${isExpanded 
            ? 'min-w-[280px] min-h-[160px] px-4 py-3 bg-[hsl(45_30%_12%/0.25)]' 
            : 'min-w-[160px] px-4 py-3 bg-[hsl(216_28%_12%/0.65)]'
          }
          backdrop-blur-md
          border-2 ${isExpanded 
            ? 'border-[hsl(45_50%_40%/0.4)] border-dashed' 
            : 'border-[hsl(45_50%_40%/0.3)]'
          }
          ${nodeData.isCurrentCanvas ? 'ring-4 ring-[hsl(45_50%_40%/0.2)] !bg-[hsl(45_30%_15%/0.4)] z-50' : ''}
          rounded-xl
          shadow-[0_4px_20px_rgba(0,0,0,0.35)]
          transition-all duration-300 ease-out
          cursor-pointer
          ${selected 
            ? 'border-[hsl(45_60%_50%/0.5)] shadow-[0_0_25px_rgba(234,179,8,0.15)]' 
            : 'hover:border-[hsl(45_50%_45%/0.45)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
          }
          ${isFocused 
            ? 'ring-2 ring-[hsl(45_85%_55%/0.5)] shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
            : ''
          }
        `}
      >
        {/* Input Handle */}
        <Handle
          id="target"
          type="target"
          position={targetPosition}
          className={`!w-2.5 !h-2.5 !bg-[hsl(45_70%_50%)] !border-2 !border-[hsl(45_60%_40%)] ${getHandleStyle(targetPosition)}`}
        />

        {/* Folder Header */}
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Button - Moved to Left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (nodeData.path) {
                toggleExpand(nodeData.path);
              }
            }}
            className={`
              mr-1 p-1.5 rounded-md 
              ${isExpanded 
                ? 'bg-[hsl(45_50%_40%/0.3)] text-[hsl(45_70%_60%)]' 
                : 'hover:bg-[hsl(45_30%_25%/0.3)] text-[hsl(210_10%_45%)] hover:text-[hsl(45_60%_60%)]'
              }
              transition-all duration-200
            `}
            title={isExpanded ? "Collapse folder" : "Expand folder to see contents"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.05 }}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </motion.div>
          </button>

          {/* Folder Icon */}
          <div className="p-1.5 rounded-lg bg-[hsl(45_50%_45%/0.15)] border border-[hsl(45_50%_50%/0.2)]">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="open"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                >
                  <FolderOpen className="w-4 h-4 text-[hsl(45_70%_55%)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="closed"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                >
                  <Folder className="w-4 h-4 text-[hsl(45_70%_55%)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Folder Name */}
          <span className={`font-medium text-[hsl(210_20%_90%)] ${nodeData.isCurrentCanvas ? 'text-lg uppercase tracking-wide' : 'text-sm'}`}>
            {nodeData.label}
          </span>

          {/* Child Count Badge - Added margin left auto to push to right */}
          {nodeData.childCount !== undefined && nodeData.childCount > 0 && (
            <span className="ml-auto px-2 py-0.5 text-xs bg-[hsl(216_20%_18%/0.8)] text-[hsl(210_10%_55%)] rounded-full border border-[hsl(210_15%_25%/0.3)]">
              {nodeData.childCount}
            </span>
          )}
        </div>

        {/* Expanded Content Area - Children will go here */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.05, ease: [0.2, 1, 0.3, 1] }}
              className="mt-3 pt-3 border-t border-[hsl(45_40%_30%/0.3)]"
            >
              <div className="min-h-[80px] flex items-center justify-center rounded-lg bg-[hsl(216_28%_8%/0.3)] border border-dashed border-[hsl(210_15%_20%/0.3)] p-4">
                <span className="text-xs text-[hsl(210_10%_40%)] italic text-center">
                  Double-click to enter folder<br/>
                  <span className="text-[hsl(45_50%_50%)]">or drag files here</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Hint - Only when collapsed */}


        {/* Output Handle */}
        <Handle
          id="source"
          type="source"
          position={sourcePosition}
          className={`!w-2.5 !h-2.5 !bg-[hsl(45_70%_50%)] !border-2 !border-[hsl(45_60%_40%)] ${getHandleStyle(sourcePosition)}`}
        />
      </motion.div>
    </NodeContextMenu>
  );
}

export const FolderNode = memo(FolderNodeComponent);
