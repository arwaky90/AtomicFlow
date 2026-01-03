import { useCallback } from 'react';

// Type for VS Code API
export interface VsCodeApi {
  postMessage: (message: Record<string, unknown>) => void;
  getState: <T>() => T;
  setState: <T>(state: T) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
    vscode?: VsCodeApi | null;
  }
}

let vscodeApi: VsCodeApi | null = null;

function getVSCodeApi() {
  if (!vscodeApi) {
    if (window.vscode) {
        // Reuse existing instance from template (CRITICAL FIX for double acquire)
        vscodeApi = window.vscode;
    } else if (window.acquireVsCodeApi) {
        vscodeApi = window.acquireVsCodeApi();
        // Store reference for global access
        window.vscode = vscodeApi;
    } else {
      console.warn('VS Code API not available (running in dev mode)');
      // Enhanced mock that routes to handleMockMessage
      vscodeApi = {
        postMessage: (msg: Record<string, unknown>) => {
          console.log('[Mock] postMessage:', msg);
          // Dispatch message to mock handler via custom event
          if (msg.command) {
            window.dispatchEvent(new CustomEvent('mock-vscode-message', {
              detail: msg
            }));
          }
        },
        getState: <T>() => ({} as T),
        setState: () => {},
      };
      window.vscode = vscodeApi;
    }
  }
  return vscodeApi;
}

export function useVsCode() {
  const vscode = getVSCodeApi();

  const postMessage = useCallback((message: Record<string, unknown>) => {
    vscode.postMessage(message);
  }, [vscode]);

  const openFile = useCallback((path: string) => {
    vscode?.postMessage({ command: 'openFile', path });
  }, [vscode]);

  const toggleDepth = useCallback((depth: number) => {
    vscode?.postMessage({ command: 'toggleDepth', depth });
  }, [vscode]);

  const signalReady = useCallback(() => {
    vscode?.postMessage({ command: 'clientReady' });
  }, [vscode]);

  return {
    postMessage,
    openFile,
    toggleDepth,
    signalReady,
  };
}
