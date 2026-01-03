import { useState, useCallback } from 'react';
import { vscode } from '@/utils/vscode';
import type { AgentTemplate } from '@/domain/agent/agent_templates';
import { AGENT_TEMPLATES } from '@/domain/agent/agent_templates';

export interface UseAiAgentDialogReturn {
  showDialog: boolean;
  manualPrompt: string;
  templates: typeof AGENT_TEMPLATES;
  openDialog: () => void;
  closeDialog: () => void;
  setManualPrompt: (value: string) => void;
  handleTemplateClick: (template: AgentTemplate) => void;
  handleManualSubmit: () => void;
}

/**
 * Composable for AI Agent Dialog state management and actions.
 * Handles both template-based and manual prompt submissions.
 */
export function useAiAgentDialog(): UseAiAgentDialogReturn {
  const [showDialog, setShowDialog] = useState(false);
  const [manualPrompt, setManualPrompt] = useState('');

  const openDialog = useCallback(() => {
    setShowDialog(true);
  }, []);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  const handleTemplateClick = useCallback((template: AgentTemplate) => {
    const query = template.promptPrefix;
    vscode.postMessage({
      command: 'openAgentChat',
      query: query
    });
    setShowDialog(false);
  }, []);

  const handleManualSubmit = useCallback(() => {
    if (!manualPrompt.trim()) return;
    
    vscode.postMessage({
      command: 'openAgentChat',
      query: manualPrompt
    });
    setShowDialog(false);
    setManualPrompt('');
  }, [manualPrompt]);

  return {
    showDialog,
    manualPrompt,
    templates: AGENT_TEMPLATES,
    openDialog,
    closeDialog,
    setManualPrompt,
    handleTemplateClick,
    handleManualSubmit,
  };
}
