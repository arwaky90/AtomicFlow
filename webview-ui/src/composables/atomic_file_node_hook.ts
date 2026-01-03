import { useMemo } from 'react';
import { 
  COMPLEXITY_COLORS, 
  getComplexityColor, 
  getFileIcon 
} from '../core/atomic_flow_node_service';
import { useGraphStore } from '@/store/graphStore';
import type { FileNodeData } from '../components/nodes/file_node';

/**
 * useFileNode - Composable for FileNode business logic
 * (Application Layer)
 */
export function useFileNode(id: string, data: FileNodeData) {
  const focusedNode = useGraphStore(state => state.focusedNode);
  const isFocused = focusedNode === id;
  
  const complexity = useMemo(() => 
    getComplexityColor(data.lineCount || 0), 
    [data.lineCount]
  );
  
  const colors = useMemo(() => 
    COMPLEXITY_COLORS[complexity], 
    [complexity]
  );

  const FileIcon = useMemo(() => 
    getFileIcon(data.label), 
    [data.label]
  );

  return {
    isFocused,
    colors,
    FileIcon
  };
}
