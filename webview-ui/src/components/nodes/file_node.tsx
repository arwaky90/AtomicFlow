import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { useFileNode } from '../../composables/atomic_file_node_hook';
import { NodeContextMenu } from '../menus/node_context_menu';

export interface FileNodeData extends Record<string, unknown> {
  label: string;
  type?: string;
  path?: string;
  lineCount?: number;
  imports?: number;
  exports?: number;
}

export type FileNodeType = Node<FileNodeData, 'file'>;

/** 
 * FileNode - Premium glassmorphism file node
 * Dark luxury design with subtle glass effects
 */
const getHandleStyle = (pos: Position) => {
  switch (pos) {
    case Position.Top: return "!top-[-5px] !left-1/2 !-translate-x-1/2";
    case Position.Bottom: return "!bottom-[-5px] !left-1/2 !-translate-x-1/2";
    case Position.Left: return "!left-[-5px] !top-1/2 !-translate-y-1/2";
    case Position.Right: return "!right-[-5px] !top-1/2 !-translate-y-1/2";
  }
};

function FileNodeComponent({ 
  id, 
  data, 
  selected,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top 
}: NodeProps<FileNodeType>) {
  const nodeData = data as FileNodeData;
  const { isFocused, FileIcon } = useFileNode(id, nodeData);

  return (
    <NodeContextMenu nodeId={id}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 1 }}
        className={`
          relative px-4 py-3 min-w-[160px]
          bg-[hsl(216_28%_12%/0.65)]
          backdrop-blur-md
          border border-[hsl(210_20%_28%/0.4)]
          rounded-xl
          shadow-[0_4px_20px_rgba(0,0,0,0.35)]
          transition-all duration-300 ease-out
          cursor-pointer
          ${selected 
            ? 'border-[hsl(195_55%_50%/0.6)] shadow-[0_0_25px_rgba(107,177,198,0.2)]' 
            : 'hover:border-[hsl(210_25%_35%/0.5)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
          }
          ${isFocused 
            ? 'ring-2 ring-[hsl(45_85%_55%/0.5)] shadow-[0_0_30px_rgba(234,179,8,0.15)]' 
            : ''
          }
        `}
      >
        {/* Input Handle */}
        <Handle
          id="target"
          type="target"
          position={targetPosition}
          className={`!w-2.5 !h-2.5 !bg-[hsl(195_50%_50%)] !border-2 !border-[hsl(195_40%_35%)] ${getHandleStyle(targetPosition)}`}
        />

        {/* Node Content */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[hsl(195_40%_45%/0.15)] border border-[hsl(195_40%_50%/0.2)]">
            <FileIcon className="w-4 h-4 text-[hsl(195_50%_60%)]" />
          </div>
          <span className="text-sm font-medium text-[hsl(210_20%_90%)] leading-tight max-w-[160px]">
            {nodeData.label}
          </span>
        </div>

        {/* Meta Info */}
        {(nodeData.lineCount || nodeData.imports) && (
          <div className="mt-2 pt-2 border-t border-[hsl(210_15%_20%/0.5)] flex gap-3 text-xs text-[hsl(210_10%_50%)]">
            {nodeData.lineCount && (
              <span className="flex items-center gap-1">
                <span className="text-[hsl(195_40%_55%)]">{nodeData.lineCount}</span>
                <span>lines</span>
              </span>
            )}
            {nodeData.imports && (
              <span className="flex items-center gap-1">
                <span className="text-[hsl(150_40%_50%)]">↓{nodeData.imports}</span>
              </span>
            )}
            {nodeData.exports && (
              <span className="flex items-center gap-1">
                <span className="text-[hsl(45_70%_55%)]">↑{nodeData.exports}</span>
              </span>
            )}
          </div>
        )}

        {/* Output Handle */}
        <Handle
          id="source"
          type="source"
          position={sourcePosition}
          className={`!w-2.5 !h-2.5 !bg-[hsl(195_50%_50%)] !border-2 !border-[hsl(195_40%_35%)] ${getHandleStyle(sourcePosition)}`}
        />
      </motion.div>
    </NodeContextMenu>
  );
}

export const FileNode = memo(FileNodeComponent);
