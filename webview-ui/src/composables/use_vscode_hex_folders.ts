/**
 * use_vscode_hex_folders
 * Composable for managing hexagonal folder detection via VS Code messaging.
 * Supports both real VS Code and mock dev mode.
 */

import { useState, useEffect, useCallback } from 'react';
import { HEXAGONAL_FOLDERS } from '@/domain/scaffold';
import { HUD_CONFIG } from '@/domain/hud';
import { postVsCodeMessage, isDevMode } from './use_mock_vscode';

interface UseVsCodeHexFoldersResult {
  /** List of folder paths that are missing */
  missingFolders: string[];
  /** Manually trigger a folder check */
  refreshFolders: () => void;
  /** Whether we're in dev mode */
  isDev: boolean;
}

/**
 * Hook for detecting missing hexagonal architecture folders.
 * Uses mock API in dev mode, real VS Code API in production.
 */
export function useVsCodeHexFolders(): UseVsCodeHexFoldersResult {
  // Initialize state based on mode to avoid immediate effect update
  const [missingFolders, setMissingFolders] = useState<string[]>(() => 
    isDevMode() ? HEXAGONAL_FOLDERS.map(f => f.path) : []
  );
  const isDev = isDevMode();

  const refreshFolders = useCallback(() => {
    postVsCodeMessage({
      command: 'checkHexFolders',
      folders: HEXAGONAL_FOLDERS.map(f => f.path)
    });
  }, []);

  useEffect(() => {
    // Listen for folder status updates
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'missingHexFolders') {
        setMissingFolders(message.folders || []);
      } else if (message.command === 'kingdomBuilt') {
        setMissingFolders([]);
      }
    };

    // Listen for mock events in dev mode
    const handleMockEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.command === 'missingHexFolders') {
        setMissingFolders(detail.folders || []);
      } else if (detail?.command === 'kingdomBuilt') {
        setMissingFolders([]);
      }
    };

    window.addEventListener('message', handleMessage);
    if (isDev) {
      window.addEventListener('vscode-message', handleMockEvent);
    }
    
    // Initial check (only in real VS Code mode)
    if (!isDev) {
      refreshFolders();
      
      // Interval check to keep sync
      const interval = setInterval(refreshFolders, HUD_CONFIG.FOLDER_CHECK_INTERVAL_MS);
      return () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(interval);
      };
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (isDev) {
        window.removeEventListener('vscode-message', handleMockEvent);
      }
    };
  }, [isDev, refreshFolders]);

  return {
    missingFolders,
    refreshFolders,
    isDev,
  };
}
