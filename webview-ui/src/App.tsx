/**
 * App - Main application component
 * Refactored: Extracted message handler to composables/use_vscode_messages.ts
 */
import { useEffect, useCallback, useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphHUD } from './components/GraphHUD';
import { GraphVisualizer } from './components/GraphVisualizer';
import { PropertiesPanel } from './components/panels/properties_panel';

import { Dashboard } from './components/Dashboard';
import { useGraphStore } from './store/graphStore';
import { useFolderStore } from './store/folder_navigation_store';
import { useVsCode } from './hooks/useVsCode';
import { createMessageHandler, type SourceFolder, type ViewState } from './composables/use_vscode_messages';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [dashboardFolders, setDashboardFolders] = useState<SourceFolder[]>([]);
  const [workspaceRoot, setWorkspaceRoot] = useState<string>('');

  const { 
    mode, 
    setMode, 
    nodes, 
    processBackendData,
    focusedNode,
    setFocusedNode,
    openEditor,
  } = useGraphStore();

  const { signalReady, postMessage } = useVsCode();

  /** Get focused node data for Properties Panel */
  const focusedNodeData = useMemo(() => {
    if (!focusedNode) return null;
    const node = nodes.find(n => n.id === focusedNode);
    if (!node) return null;
    
    return {
      // Spread data first
      ...node.data,
      id: node.id,
      label: (node.data?.label as string) || node.id,
      path: (node.data?.path as string) || node.path,
      type: node.type,
      lineCount: node.data?.lineCount,
      imports: node.data?.imports,
      exports: node.data?.exports,
    };
  }, [focusedNode, nodes]);

  /** Handle messages from VS Code extension */
  useEffect(() => {
    const handleMessage = createMessageHandler({
      setDashboardFolders,
      setWorkspaceRoot,
      setViewState,
      processBackendData,
      setSourceRoot: (src, root, name) => useFolderStore.getState().setSourceRoot(src, root, name),
      openEditor,
      setFocusedNode,
      findNodeByPath: (path) => {
        // Use getState() to get fresh nodes, avoiding stale closure
        const currentNodes = useGraphStore.getState().nodes;
        const found = currentNodes.find(n => n.data?.path === path);
        // console.log('[findNodeByPath] Looking for:', path, '| Found:', found?.id || 'NONE');
        return found;
      },
      // Context Menu Actions
      updateNodePath: (oldPath, newPath, newName) => {
        const { nodes, setNodes } = useGraphStore.getState();
        setNodes(nodes.map(n => {
          if (n.data?.path === oldPath) {
             return {
                 ...n,
                 path: newPath,
                 data: { ...n.data, path: newPath, label: newName, name: newName }
             };
          }
          return n;
        }));
      },
      duplicateNode: (originalPath, newPath, newName) => {
        const { nodes, setNodes } = useGraphStore.getState();
        const original = nodes.find(n => n.data?.path === originalPath);
        if (original) {
          const newNode = {
            ...original,
            id: `mock-${Date.now()}`,
            position: { x: original.position.x + 30, y: original.position.y + 30 },
            path: newPath,
            data: { ...original.data, path: newPath, label: newName, name: newName },
            selected: true
          };
          setNodes([...nodes, newNode]);
        }
      },
      removeNodes: (paths) => {
        const { nodes, setNodes } = useGraphStore.getState();
        setNodes(nodes.filter(n => !paths.includes(n.data?.path || '')));
      }
    });
    
    window.addEventListener('message', handleMessage);
    signalReady();
    return () => window.removeEventListener('message', handleMessage);
  }, [openEditor, processBackendData, signalReady, setFocusedNode]);

  /** Handle returning to Dashboard - INSTANT using cached folders */
  const handleGoToDashboard = useCallback(() => {
    if (dashboardFolders.length > 0) {
      setViewState('dashboard');
    } else {
      postMessage({ command: 'requestDashboard' });
      setViewState('loading');
    }
  }, [dashboardFolders, postMessage]);

  // Register goToDashboard callback in folder store
  useEffect(() => {
    useFolderStore.getState().setGoToDashboard(handleGoToDashboard);
  }, [handleGoToDashboard]);

  /** Handle folder selection from Dashboard */
  const handleSelectFolder = useCallback((path: string) => {
    postMessage({ command: 'selectSourceRoot', path });
    setViewState('loading');
  }, [postMessage]);

  /** Handle "Open in Editor" from Properties Panel */
  const handleInspectFile = useCallback((path: string) => {
    postMessage({ command: 'openFile', path });
  }, [postMessage]);

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard state
  if (viewState === 'dashboard') {
    return (
      <Dashboard
        folders={dashboardFolders}
        workspaceRoot={workspaceRoot}
        onSelect={handleSelectFolder}
      />
    );
  }

  // Graph state
  return (
    <ReactFlowProvider>
      <div className="w-screen h-screen bg-background text-foreground overflow-hidden relative">
        <GraphHUD mode={mode} onModeChange={setMode} nodeCount={nodes.length} />
        <GraphVisualizer />
        <PropertiesPanel 
          node={focusedNodeData}
          onClose={() => setFocusedNode(null)}
          onInspect={handleInspectFile}
        />
      </div>
    </ReactFlowProvider>
  );
}
