import { useAiAgentDialog } from '@/composables/use_ai_agent_dialog';
import { AiAgentTriggerButton } from './ai_agent_trigger_button';
import { AiAgentDialog } from './ai_agent_dialog';

interface AiAgentButtonProps {
  /** @deprecated Legacy prop for compatibility */
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

/**
 * AI Agent Button - Main Container Component
 * 
 * Composes the trigger button and dialog together.
 * All business logic is handled by the useAiAgentDialog composable.
 */
export function AiAgentButton({ isAnalyzing = false }: AiAgentButtonProps) {
  const {
    showDialog,
    manualPrompt,
    templates,
    openDialog,
    closeDialog,
    setManualPrompt,
    handleTemplateClick,
    handleManualSubmit,
  } = useAiAgentDialog();

  return (
    <>
      <AiAgentTriggerButton 
        onClick={openDialog}
        disabled={isAnalyzing}
      />

      <AiAgentDialog
        open={showDialog}
        onOpenChange={(open) => !open && closeDialog()}
        templates={templates}
        manualPrompt={manualPrompt}
        onManualPromptChange={setManualPrompt}
        onTemplateClick={handleTemplateClick}
        onManualSubmit={handleManualSubmit}
      />
    </>
  );
}
