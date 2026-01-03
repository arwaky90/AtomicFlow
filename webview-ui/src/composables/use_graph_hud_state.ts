/**
 * use_graph_hud_state
 * Unified state composition for GraphHUD component.
 * Facade pattern combining all HUD-related hooks.
 */

import { useVsCodeHexFolders } from './use_vscode_hex_folders';
import { useClipboardActions } from './use_clipboard_actions';
import { useAiAnalysis } from './use_ai_analysis';

interface GraphHudActions {
  copyToClipboard: () => void;
  takeScreenshot: () => void;
  handleAiAnalysis: () => Promise<void>;
  refreshFolders: () => void;
}

interface UseGraphHudStateResult {
  /** List of missing hexagonal folder paths */
  missingFolders: string[];
  /** Whether copy feedback is active */
  copied: boolean;
  /** Whether AI analysis is in progress */
  isAnalyzing: boolean;
  /** Action handlers for HUD buttons */
  actions: GraphHudActions;
}

/**
 * Unified hook for all GraphHUD state and actions.
 * Composes useVsCodeHexFolders, useClipboardActions, and useAiAnalysis.
 */
export function useGraphHudState(): UseGraphHudStateResult {
  const { missingFolders, refreshFolders } = useVsCodeHexFolders();
  const { copied, copyToClipboard, takeScreenshot } = useClipboardActions();
  const { isAnalyzing, handleAiAnalysis } = useAiAnalysis();

  return {
    missingFolders,
    copied,
    isAnalyzing,
    actions: {
      copyToClipboard,
      takeScreenshot,
      handleAiAnalysis,
      refreshFolders,
    },
  };
}
