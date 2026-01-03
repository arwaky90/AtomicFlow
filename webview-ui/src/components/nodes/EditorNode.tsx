import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from '@xyflow/react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-dark.css';

import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGraphStore } from '@/store/graphStore';

export function EditorNode({ data, selected }: NodeProps) {
  const [code, setCode] = useState(data.content as string || '');
  const [hasChanges, setHasChanges] = useState(false);
  const { closeEditor, saveEditorContent } = useGraphStore();

  const fileName = (data.fileName as string) || 'untitled';
  const filePath = (data.filePath as string) || '';

  // Detect language for Prism
  const getLanguage = (fname: string) => {
    if (fname.endsWith('.ts') || fname.endsWith('.tsx')) return languages.tsx || languages.js;
    if (fname.endsWith('.js') || fname.endsWith('.jsx')) return languages.jsx || languages.js;
    if (fname.endsWith('.rs')) return languages.rust;
    if (fname.endsWith('.json')) return languages.json;
    if (fname.endsWith('.md')) return languages.markdown;
    return languages.text; // fallback
  };

  const handleValueChange = (newCode: string) => {
    setCode(newCode);
    setHasChanges(newCode !== data.content);
  };

  const handleSave = () => {
    if (saveEditorContent) {
      saveEditorContent(filePath, code);
      setHasChanges(false);
    }
  };

  const handleClose = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

  // Double click header to close
  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    handleClose();
  };

  // Prevent drag propagation when interacting with editor
  // but allow when clicking outside? No, default behavior is fine if we use specific drag handle.

  return (
    <>
      <NodeResizer 
        minWidth={300} 
        minHeight={200}
        isVisible={selected} 
        lineClassName="border-primary" 
        handleClassName="h-3 w-3 bg-primary border-2 border-background rounded"
      />
      <div 
        className={`nowheel cursor-default group relative flex flex-col w-full h-full min-w-[400px] min-h-[300px] transition-all duration-300 ${
          selected ? 'node-glass-selected' : 'border-transparent'
        } node-glass overflow-hidden`}
        style={{ zIndex: selected ? 9999 : 50 }}
      >
        {/* Header / Drag Handle */}
        <div 
          className="editor-drag-handle flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 select-none cursor-grab active:cursor-grabbing backdrop-blur-md"
          onDoubleClick={handleHeaderDoubleClick}
        >
          <div className="flex items-center gap-3">
             <div className="flex gap-2 mr-2 group/traffic">
               <div 
                 className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 hover:shadow-glow-red cursor-pointer transition-all duration-200" 
                 onClick={(e) => { e.stopPropagation(); handleClose(); }} 
                 title="Close"
               />
               <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-all duration-200" />
               <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-all duration-200" />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground tracking-tight">{fileName}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[200px] opacity-60">{filePath}</span>
             </div>
             {hasChanges && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-primary font-medium">Unsaved</span>
                </div>
             )}
          </div>
          <div className="flex items-center gap-1">
               <Button 
                 size="icon" 
                 variant="ghost" 
                 className="h-7 w-7 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary border border-white/5 hover:border-white/10 shadow-sm backdrop-blur-sm transition-all nodrag nopan" 
                 onMouseDown={(e) => e.stopPropagation()}
                 onPointerDown={(e) => e.stopPropagation()}
                 onClick={(e) => {
                   e.stopPropagation();
                   e.preventDefault();
                   handleSave();
                 }} 
                 title="Save (Ctrl+S)"
               >
                  <Save className="w-4 h-4" />
               </Button>
               <Button 
                 size="icon" 
                 variant="ghost" 
                 className="h-7 w-7 bg-white/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-white/5 hover:border-destructive/20 shadow-sm backdrop-blur-sm transition-all nodrag nopan" 
                 onMouseDown={(e) => e.stopPropagation()}
                 onPointerDown={(e) => e.stopPropagation()}
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   e.preventDefault(); 
                   handleClose(); 
                 }} 
                 title="Close"
               >
                  <X className="w-4 h-4" />
               </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto bg-black/20 text-sm font-mono scrollbar-hide text-left backdrop-blur-sm p-1" 
             onDoubleClick={(e) => e.stopPropagation()} 
             onKeyDown={(e) => e.stopPropagation()}
        >
          <Editor
            value={code}
            onValueChange={handleValueChange}
            highlight={code => highlight(code, getLanguage(fileName), 'text')}
            padding={20}
            className="min-h-full font-mono"
            style={{
              fontFamily: '"Fira Code", "JetBrains Mono", monospace',
              fontSize: 13,
              backgroundColor: 'transparent',
            }}
            textareaClassName="focus:outline-none"
          />
        </div>

        {/* Status Bar */}
        <div className="px-4 py-1 bg-white/5 border-t border-white/5 text-[10px] text-muted-foreground flex justify-between items-center backdrop-blur-md">
            <span>{code.length} chars</span>
            <span className="opacity-50">{fileName.split('.').pop()?.toUpperCase() || 'TEXT'}</span>
        </div>

        {/* Handles for connections - hidden but present for ReactFlow logic if needed */}
        <Handle type="target" position={Position.Left} className="opacity-0 pointer-events-none" />
        <Handle type="source" position={Position.Right} className="opacity-0 pointer-events-none" />
      </div>
    </>
  );
}

export default memo(EditorNode);
