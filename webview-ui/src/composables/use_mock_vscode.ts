/**
 * use_mock_vscode.ts
 * Mock VS Code API for Chrome dev testing
 * Simulates folder creation, file operations, and adds nodes to graph
 */

import { HEXAGONAL_FOLDERS } from '@/domain/scaffold';
import { useGraphStore, type GraphNode } from '@/store/graphStore';
import { useFolderStore } from '@/store/folder_navigation_store';

// In-memory mock storage
const mockFolders = new Set<string>();
const mockFiles = new Set<string>();

/**
 * Determine role based on file extension for Kingdom mode coloring
 */
function getFileRole(extension: string): string {
  switch (extension) {
    case 'tsx':
    case 'jsx':
      return 'component'; // React components
    case 'vue':
      return 'component'; // Vue components
    case 'rs':
      return 'core'; // Rust = Domain core
    case 'ts':
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'composable'; // Logic files
    case 'json':
      return 'assets'; // Config/data
    case 'md':
      return 'utils'; // Documentation
    default:
      return 'default';
  }
}

// Check if we're in dev mode (Chrome, not VS Code)
export const isDevMode = (): boolean => {
  try {
    // @ts-expect-error - acquireVsCodeApi only exists in VS Code webview
    acquireVsCodeApi();
    return false;
  } catch {
    return true;
  }
};



/**
 * Mock VS Code message handler for dev mode
 */
export function handleMockMessage(command: string, payload: Record<string, unknown>): void {
  if (!isDevMode()) return;

  const { currentFolder } = useFolderStore.getState();


  switch (command) {
    case 'buildKingdom': {
      const folders = (payload.folders as string[]) || HEXAGONAL_FOLDERS.map(f => f.path);
      console.log('🏰 [MockVSCode] Creating folders:', folders);
      
      // Add to mock folder storage
      folders.forEach(folder => {
        mockFolders.add(folder);
        console.log(`  ✅ Created: ${folder}`);
      });

      // Dispatch success event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vscode-message', {
          detail: { command: 'kingdomBuilt', folders }
        }));
      }, 500);
      break;
    }

    case 'checkHexFolders': {
      const foldersToCheck = payload.folders as string[];
      const missing = foldersToCheck.filter(f => !mockFolders.has(f));
      
      console.log('🔍 [MockVSCode] Checking folders:', { total: foldersToCheck.length, missing: missing.length });

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vscode-message', {
          detail: { command: 'missingHexFolders', folders: missing }
        }));
      }, 100);
      break;
    }

    case 'createFolder': {
      const folderName = payload.name as string;
      const parentPath = (payload.parentPath as string) || currentFolder;
      const fullPath = `${parentPath}/${folderName}`;
      
      console.log('📁 [MockVSCode] Creating folder:', fullPath);
      mockFolders.add(fullPath);

      // Add folder node to graph
      const newNode: GraphNode = {
        id: `mock-folder-${Date.now()}`,
        type: 'folder',
        position: { x: 100, y: 100 },
        data: {
          label: folderName,
          type: 'folder',
          path: fullPath,
          role: 'default',
          emoji: '📁',
          isMock: true,
          childCount: 0,
        },
      };

      const { nodes, setNodes } = useGraphStore.getState();
      setNodes([...nodes, newNode]);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vscode-message', {
          detail: { command: 'folderCreated', path: fullPath }
        }));
      }, 200);
      break;
    }

    case 'createFile': {
      const fileName = payload.name as string;
      const parentPath = (payload.parentPath as string) || currentFolder;
      const content = payload.content as string || '';
      const extension = payload.extension as string || 'ts';
      const fullPath = `${parentPath}/${fileName}`;
      
      console.log('📄 [MockVSCode] Creating file:', fullPath);
      console.log('📝 [MockVSCode] Content preview:', content.slice(0, 100) + '...');
      mockFiles.add(fullPath);

      // Add file node to graph
      const newNode: GraphNode = {
        id: `mock-file-${Date.now()}`,
        type: 'file',
        position: { x: 100, y: 100 },
        data: {
          label: fileName,
          type: 'file',
          path: fullPath,
          role: getFileRole(extension),
          isMock: true,
          lineCount: content.split('\n').length,
          language: extension,
        },
      };

      const { nodes, setNodes } = useGraphStore.getState();
      setNodes([...nodes, newNode]);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vscode-message', {
          detail: { command: 'fileCreated', path: fullPath }
        }));
      }, 200);
      break;
    }

    case 'createNode': {
      // Legacy - redirect to createFile
      const nodePath = payload.path as string;
      console.log('📄 [MockVSCode] Creating node (legacy):', nodePath);
      break;
    }

    case 'deleteNode': {
      const nodePath = payload.path as string;
      console.log('🗑️ [MockVSCode] Deleting:', nodePath);
      
      // Remove from mock storage
      mockFolders.delete(nodePath);
      mockFiles.delete(nodePath);

      // Remove node from graph
      const { nodes, setNodes } = useGraphStore.getState();
      setNodes(nodes.filter(n => n.data?.path !== nodePath));

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vscode-message', {
          detail: { command: 'nodeDeleted', path: nodePath }
        }));
      }, 200);
      break;
    }

    case 'getFileContent': {
      const filePath = payload.path as string;
      console.log('📖 [MockVSCode] Getting file content for:', filePath);
      
      // Simulate file content for dev mode
      const mockContent = `// Mock content for: ${filePath}\n// This is simulated content in dev mode.\n\nexport default function Example() {\n  return <div>Hello from ${filePath}</div>;\n}\n`;
      
      // Dispatch fileContent event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vscode-message', {
          detail: { 
            command: 'fileContent', 
            content: mockContent,
            filePath: filePath, // Use same path format for matching
            fileName: filePath.split('/').pop() || 'untitled'
          }
        }));
      }, 100);
      break;
    }

    default:
      console.log(`📨 [MockVSCode] Unhandled command: ${command}`, payload);
  }
}

/**
 * Initialize mock message listener for dev mode
 */
export function initMockVsCodeListener(): () => void {
  if (!isDevMode()) return () => {};

  console.log('🧪 [MockVSCode] Dev mode enabled - simulating VS Code API');

  // Handle outgoing vscode-message events (from mock handlers)
  const handleVsCodeEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    // Forward to regular message handlers
    window.postMessage(detail, '*');
  };

  // Handle incoming mock-vscode-message events (from useVsCode hook)
  const handleMockEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail as { command: string; [key: string]: unknown };
    if (detail.command) {
      handleMockMessage(detail.command, detail);
    }
  };

  window.addEventListener('vscode-message', handleVsCodeEvent);
  window.addEventListener('mock-vscode-message', handleMockEvent);
  
  return () => {
    window.removeEventListener('vscode-message', handleVsCodeEvent);
    window.removeEventListener('mock-vscode-message', handleMockEvent);
  };
}

/**
 * Post message to VS Code (or mock in dev mode)
 */
export function postVsCodeMessage(message: { command: string; [key: string]: unknown }): void {
  if (isDevMode()) {
    handleMockMessage(message.command, message);
  } else {
    try {
      // @ts-expect-error - acquireVsCodeApi only exists in VS Code webview
      const vscode = acquireVsCodeApi();
      vscode.postMessage(message);
    } catch (error) {
      console.error('Failed to post message to VS Code:', error);
    }
  }
}

/**
 * Get mock folder state (for debugging)
 */
export function getMockFolders(): string[] {
  return Array.from(mockFolders);
}

/**
 * Reset mock state (for testing)
 */
export function resetMockState(): void {
  mockFolders.clear();
}
