/**
 * CreateNodeDialog - Enhanced dialog for creating files and folders
 * Presentation layer - uses composable for business logic
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FilePlus, FolderPlus, X } from 'lucide-react';
import { isDevMode } from '@/composables/use_mock_vscode';
import { useCreateNodeDialog } from '@/composables/use_create_node_dialog';
import {
  CreateNodeTypeToggle,
  CreateNodeTemplatePicker,
  CreateNodeNameInput,
} from './create_node';

export function CreateNodeDialog() {
  const {
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
  } = useCreateNodeDialog();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md"
        >
          <Card className="overflow-hidden border-zinc-700 bg-zinc-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-800/50">
              <div className="flex items-center gap-2 text-primary">
                {nodeType === 'file' ? <FilePlus className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                <span className="text-sm font-bold uppercase tracking-wider">
                  Create {nodeType === 'file' ? 'File' : 'Folder'}
                </span>
                {isDevMode() && <span className="text-xs text-yellow-500 ml-2">(Mock)</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={close} className="h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <CreateNodeTypeToggle nodeType={nodeType} onTypeChange={setNodeType} />

              <CreateNodeNameInput
                nodeType={nodeType}
                name={name}
                selectedExtension={selectedExtension}
                inputRef={inputRef}
                onNameChange={setName}
                onKeyDown={handleKeyDown}
                onToggleTemplates={() => setShowTemplates(!showTemplates)}
              />

              {nodeType === 'file' && showTemplates && (
                <CreateNodeTemplatePicker
                  selectedExtension={selectedExtension}
                  onSelect={setSelectedExtension}
                  onClose={() => setShowTemplates(false)}
                />
              )}
              
              {/* Preview */}
              {nodeType === 'file' && selectedTemplate && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-lg">{selectedTemplate.emoji}</span>
                  <span>{selectedTemplate.label}</span>
                </div>
              )}
              
              {/* Target Path */}
              <div className="text-xs text-muted-foreground">
                Target: <span className="text-foreground font-mono">{resolvedPath || './'}</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={close}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name.trim()} className="px-6 gap-2">
                  {nodeType === 'file' ? <FilePlus className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                  Create
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
