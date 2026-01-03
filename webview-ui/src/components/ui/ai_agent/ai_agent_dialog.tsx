import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AgentTemplate } from '@/domain/agent/agent_templates';
import { AiAgentTemplateGrid } from './ai_agent_template_grid';
import { AiAgentManualInput } from './ai_agent_manual_input';

interface AiAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: readonly AgentTemplate[];
  manualPrompt: string;
  onManualPromptChange: (value: string) => void;
  onTemplateClick: (template: AgentTemplate) => void;
  onManualSubmit: () => void;
}

/**
 * Dialog for selecting agent roles or entering manual prompts.
 * Composes template grid and manual input sections.
 */
export function AiAgentDialog({
  open,
  onOpenChange,
  templates,
  manualPrompt,
  onManualPromptChange,
  onTemplateClick,
  onManualSubmit,
}: AiAgentDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="bg-zinc-950/95 border-zinc-800 backdrop-blur-xl sm:max-w-[500px] text-zinc-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Select Agent Role
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Templates Grid */}
              <AiAgentTemplateGrid 
                templates={templates}
                onTemplateClick={onTemplateClick}
              />

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500">Or type manually</span>
                </div>
              </div>

              {/* Manual Input */}
              <AiAgentManualInput
                value={manualPrompt}
                onChange={onManualPromptChange}
                onSubmit={onManualSubmit}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
