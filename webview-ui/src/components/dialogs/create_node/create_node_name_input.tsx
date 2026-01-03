/**
 * CreateNodeNameInput - Name input with extension badge
 */
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';
import type { CreateType } from '@/composables/use_create_node_dialog';
import type { FileLanguage } from '@/domain/scaffold';

interface CreateNodeNameInputProps {
  nodeType: CreateType;
  name: string;
  selectedExtension: FileLanguage;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onNameChange: (name: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onToggleTemplates: () => void;
}

export function CreateNodeNameInput({
  nodeType,
  name,
  selectedExtension,
  inputRef,
  onNameChange,
  onKeyDown,
  onToggleTemplates,
}: CreateNodeNameInputProps) {
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={nodeType === 'file' ? 'my_component' : 'folder_name'}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="h-12 bg-zinc-950 border-zinc-800 focus-visible:ring-primary font-mono text-sm pr-20"
      />
      {nodeType === 'file' && (
        <button
          onClick={onToggleTemplates}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-400 hover:bg-zinc-700 flex items-center gap-1"
        >
          .{selectedExtension} <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
