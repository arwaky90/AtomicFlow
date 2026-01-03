/**
 * CreateNodeTypeToggle - File/Folder toggle buttons
 */
import { Button } from '@/components/ui/button';
import { FileCode, Folder } from 'lucide-react';
import type { CreateType } from '@/composables/use_create_node_dialog';

interface CreateNodeTypeToggleProps {
  nodeType: CreateType;
  onTypeChange: (type: CreateType) => void;
}

export function CreateNodeTypeToggle({ nodeType, onTypeChange }: CreateNodeTypeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant={nodeType === 'file' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTypeChange('file')}
        className="flex-1 gap-2"
      >
        <FileCode className="w-4 h-4" /> File
      </Button>
      <Button 
        variant={nodeType === 'folder' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTypeChange('folder')}
        className="flex-1 gap-2"
      >
        <Folder className="w-4 h-4" /> Folder
      </Button>
    </div>
  );
}
