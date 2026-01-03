/**
 * use_clipboard_actions
 * Composable for clipboard copy and screenshot actions.
 */

import { useState, useCallback } from 'react';
import { HUD_CONFIG, takeAndDownloadScreenshot } from '@/domain/hud';

interface UseClipboardActionsResult {
  /** Whether content was recently copied (for visual feedback) */
  copied: boolean;
  /** Copy graph node data to clipboard */
  copyToClipboard: () => void;
  /** Take and download a screenshot of the graph */
  takeScreenshot: () => void;
}

/**
 * Hook for managing clipboard and screenshot operations.
 */
export function useClipboardActions(): UseClipboardActionsResult {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    // Get nodes data from React Flow
    const nodesData = document.querySelectorAll('.react-flow__node');
    const data = Array.from(nodesData).map(n => n.textContent);
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    
    setCopied(true);
    setTimeout(() => setCopied(false), HUD_CONFIG.COPIED_RESET_DELAY_MS);
  }, []);

  const takeScreenshot = useCallback(() => {
    takeAndDownloadScreenshot().catch(console.error);
  }, []);

  return {
    copied,
    copyToClipboard,
    takeScreenshot,
  };
}
