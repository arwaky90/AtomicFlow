import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && !window.acquireVsCodeApi) {
  setTimeout(() => {
    window.postMessage({
      command: 'showDashboard',
      folders: [
        { name: 'Demo Project', path: '/demo', relativePath: '', fileCount: 42 },
        { name: 'Another Repo', path: '/repo', relativePath: '', fileCount: 15 }
      ],
      workspaceRoot: '/demo/root'
    }, '*');
  }, 500);

  window.addEventListener('message', (event) => {
    const message = event.data;
    const origin = message.command || 'unknown';
    console.log(`[Mock Backend] Received: ${origin}`, message);

    if (message.command === 'selectSourceRoot') {
      console.log('[Mock Backend] Loading project:', message.path);
      setTimeout(() => {
        window.postMessage({
          command: 'updateGraph',
          data: {
            nodes: [
               // Root Files
               { id: 'ext', name: 'extension.ts', path: '/src/extension.ts', type: 'file', node_type: 'file' },
               { id: 'extLog', name: 'extensionLogic.ts', path: '/src/extensionLogic.ts', type: 'file', node_type: 'file' },
               { id: 'graph', name: 'graphBuilder.ts', path: '/src/graphBuilder.ts', type: 'file', node_type: 'file' },
               
               // Directories
               { id: 'adapters_dir', name: 'adapters', path: '/src/adapters', type: 'directory', node_type: 'directory' },
               { id: 'services_dir', name: 'services', path: '/src/services', type: 'directory', node_type: 'directory' },
               { id: 'parsers_dir', name: 'parsers', path: '/src/parsers', type: 'directory', node_type: 'directory' },
               
               // Files in Directories (Partial)
               { id: 'adapter_1', name: 'atomic_file_adapter.ts', path: '/src/adapters/atomic_file_adapter.ts', type: 'file', node_type: 'file' },
               { id: 'service_1', name: 'atomic_scanner_service.ts', path: '/src/services/atomic_scanner_service.ts', type: 'file', node_type: 'file' }
            ],
            links: [
               { source: 'ext', target: 'extLog' },
               { source: 'extLog', target: 'graph' },
               { source: 'graph', target: 'adapters_dir' },
               { source: 'graph', target: 'services_dir' },
               { source: 'adapters_dir', target: 'adapter_1' },
               { source: 'services_dir', target: 'service_1' }
            ]
          },
          sourceRoot: '/src',  // Match the paths in mock nodes
          workspaceRoot: message.path,
          sourceRootName: 'src'
        }, '*');
      }, 1000);
    }

    if (message.command === 'getFileContent') {
        console.log('[Mock Backend] Returning content for:', message.path);
        setTimeout(() => {
            window.postMessage({
                command: 'fileContent',
                filePath: message.path,
                content: `// Mock content for ${message.path}\n\nexport const mock = true;`
            }, '*');
        }, 200);
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTEXT MENU ACTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    if (message.command === 'openFile') {
        console.log('📂 [Mock Backend] Opening file:', message.path);
        // In real VS Code, this opens the file in editor.
        // In mock mode, we show a toast-like console message.
        console.log(`✅ [Mock] File "${(message.path as string)?.split('/').pop()}" would open in VS Code editor`);
    }

    if (message.command === 'renameFile') {
        console.log('✏️ [Mock Backend] Rename requested for:', message.path);
        const oldPath = message.path as string;
        const fileName = oldPath.split('/').pop() || 'untitled';
        
        // Use setTimeout to allow the context menu to close first
        setTimeout(() => {
            const newName = window.prompt(`📝 Rename "${fileName}" to:`, fileName);
            if (newName && newName !== fileName) {
                const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;
                console.log(`✅ [Mock] Renamed: ${fileName} → ${newName}`);
                
                // Dispatch rename success event
                window.postMessage({
                    command: 'fileRenamed',
                    oldPath: oldPath,
                    newPath: newPath,
                    newName: newName
                }, '*');
            } else {
                console.log('❌ [Mock] Rename cancelled');
            }
        }, 100);
    }

    if (message.command === 'duplicateFile') {
        console.log('📋 [Mock Backend] Duplicate requested for:', message.path);
        const originalPath = message.path as string;
        const parts = originalPath.split('/');
        const fileName = parts.pop() || 'file';
        const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
        const baseName = fileName.replace(ext, '');
        const newName = `${baseName} (copy)${ext}`;
        const newPath = [...parts, newName].join('/');
        
        console.log(`✅ [Mock] Duplicated: ${fileName} → ${newName}`);
        
        setTimeout(() => {
            window.postMessage({
                command: 'fileDuplicated',
                originalPath: originalPath,
                newPath: newPath,
                newName: newName
            }, '*');
        }, 200);
    }

    if (message.command === 'deleteFiles') {
        const paths = message.paths as string[];
        console.log('🗑️ [Mock Backend] Delete requested for:', paths);
        
        setTimeout(() => {
            console.log(`✅ [Mock] Deleted ${paths.length} file(s)`);
            window.postMessage({
                command: 'filesDeleted',
                paths: paths
            }, '*');
        }, 200);
    }

    if (message.command === 'refresh') {
        console.log('🔄 [Mock Backend] Refresh requested');
        // Re-send the mock graph data to simulate a refresh
        setTimeout(() => {
            console.log('✅ [Mock] Graph refreshed');
            window.postMessage({
                command: 'updateGraph',
                data: {
                    nodes: [
                       { id: 'ext', name: 'extension.ts', path: '/src/extension.ts', type: 'file', node_type: 'file' },
                       { id: 'extLog', name: 'extensionLogic.ts', path: '/src/extensionLogic.ts', type: 'file', node_type: 'file' },
                       { id: 'graph', name: 'graphBuilder.ts', path: '/src/graphBuilder.ts', type: 'file', node_type: 'file' },
                       { id: 'adapters_dir', name: 'adapters', path: '/src/adapters', type: 'directory', node_type: 'directory' },
                       { id: 'services_dir', name: 'services', path: '/src/services', type: 'directory', node_type: 'directory' },
                       { id: 'parsers_dir', name: 'parsers', path: '/src/parsers', type: 'directory', node_type: 'directory' },
                       { id: 'adapter_1', name: 'atomic_file_adapter.ts', path: '/src/adapters/atomic_file_adapter.ts', type: 'file', node_type: 'file' },
                       { id: 'service_1', name: 'atomic_scanner_service.ts', path: '/src/services/atomic_scanner_service.ts', type: 'file', node_type: 'file' }
                    ],
                    links: [
                       { source: 'ext', target: 'extLog' },
                       { source: 'extLog', target: 'graph' },
                       { source: 'graph', target: 'adapters_dir' },
                       { source: 'graph', target: 'services_dir' },
                       { source: 'adapters_dir', target: 'adapter_1' },
                       { source: 'services_dir', target: 'service_1' }
                    ]
                },
                sourceRoot: '/src',
                workspaceRoot: '/demo',
                sourceRootName: 'src'
            }, '*');
        }, 500);
    }
  });

  // Mock window.vscode if not present
  if (!window.vscode) {
    window.vscode = {
        postMessage: (msg: unknown) => window.postMessage(msg, '*'),
        getState: <T,>() => ({} as T),
        setState: () => {}
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
