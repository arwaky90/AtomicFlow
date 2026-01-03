/**
 * use_create_node_dialog - Business logic for CreateNodeDialog
 * Handles state, file/folder creation, and keyboard shortcuts
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useFolderStore } from '@/store/folder_navigation_store';
import { getTemplateByExtension, type FileLanguage } from '@/domain/scaffold';
import { postVsCodeMessage } from '@/composables/use_mock_vscode';

export type CreateType = 'file' | 'folder';

export interface CreateNodeDialogState {
  // State
  isOpen: boolean;
  nodeType: CreateType;
  name: string;
  selectedExtension: FileLanguage;
  showTemplates: boolean;
  resolvedPath: string;
  selectedTemplate: ReturnType<typeof getTemplateByExtension>;
  
  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>;
  
  // Actions
  setNodeType: (type: CreateType) => void;
  setName: (name: string) => void;
  setSelectedExtension: (ext: FileLanguage) => void;
  setShowTemplates: (show: boolean) => void;
  handleCreate: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  close: () => void;
}

export function useCreateNodeDialog(): CreateNodeDialogState {
  const isOpen = useGraphStore(state => state.isCreateDialogOpen);
  const close = useGraphStore(state => state.closeDialogs);
  const targetPath = useGraphStore(state => state.creationTargetPath);
  const { currentFolder } = useFolderStore();
  
  const resolvedPath = targetPath || currentFolder;

  const [nodeType, setNodeType] = useState<CreateType>('file');
  const [name, setName] = useState('');
  const [selectedExtension, setSelectedExtension] = useState<FileLanguage>('ts');
  const [showTemplates, setShowTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  // Reset state when dialog opens fresh
  // Use queueMicrotask to avoid synchronous setState within effect body
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      queueMicrotask(() => {
        setName('');
        setNodeType('file');
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    
    const fileName = nodeType === 'file' && !name.includes('.') 
      ? `${name}.${selectedExtension}` 
      : name;

    if (nodeType === 'folder') {
      postVsCodeMessage({
        command: 'createFolder',
        name: fileName,
        parentPath: resolvedPath,
      });
    } else {
      const template = getTemplateByExtension(selectedExtension);
      const content = template?.defaultContent(fileName) || '';
      
      postVsCodeMessage({
        command: 'createFile',
        name: fileName,
        parentPath: resolvedPath,
        extension: selectedExtension,
        content,
      });
    }
    
    close();
  }, [name, nodeType, selectedExtension, resolvedPath, close]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') close();
  }, [handleCreate, close]);

  const selectedTemplate = getTemplateByExtension(selectedExtension);

  return {
    isOpen,
    nodeType,
    name,
    selectedExtension,
    showTemplates,
    resolvedPath,
    selectedTemplate,
    inputRef,
    setNodeType,
    setName,
    setSelectedExtension,
    setShowTemplates,
    handleCreate,
    handleKeyDown,
    close,
  };
}
