// src/extension.ts - FIXED: DeepSeek's singleton pattern with proper dispose
import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('🔧 Atomic Flow SHELL activated');
    
    let currentActivation: any = null;
    let registeredDisposables: vscode.Disposable[] = [];
    
    const activateLogic = () => {
        try {
            const logicPath = path.join(context.extensionPath, 'out', 'extensionLogic.js');
            
            // 1. CLEAR CACHE - aggressive
            Object.keys(require.cache).forEach(key => {
                if (key.includes(path.join(context.extensionPath, 'out'))) {
                    delete require.cache[key];
                    console.log(`🧹 Cleared: ${path.basename(key)}`);
                }
            });
            
            // 2. Dispose previous registrations (CRITICAL FIX!)
            registeredDisposables.forEach(d => {
                try { d.dispose(); } catch (e) { /* ignore */ }
            });
            registeredDisposables = [];
            
            // 3. Deactivate previous logic
            if (currentActivation?.deactivate) {
                currentActivation.deactivate();
            }
            
            // 4. Require fresh module
            delete require.cache[require.resolve(logicPath)];
            const ExtensionLogic = require(logicPath);
            
            // 5. Activate with tracking
            if (ExtensionLogic.activate) {
                const newDisposables = ExtensionLogic.activate(context);
                if (Array.isArray(newDisposables)) {
                    registeredDisposables = newDisposables;
                    newDisposables.forEach(d => {
                        if (!context.subscriptions.includes(d)) {
                            context.subscriptions.push(d);
                        }
                    });
                }
            }
            
            currentActivation = ExtensionLogic;
            console.log('✅ Hot reload successful');
            vscode.window.showInformationMessage('🔥 Atomic Flow: Reloaded!');
            
        } catch (error: any) {
            console.error('❌ Hot reload failed:', error);
            vscode.window.showErrorMessage(`Atomic Flow error: ${error.message}`);
        }
    };
    
    // Initial activation
    activateLogic();
    
    // Watch for changes in out/ and media/
    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(context.extensionUri, '{out,media}/**/*.{js,css,html}')
    );
    
    // Watch trigger file
    const triggerWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(context.extensionUri, '.hot-reload-trigger')
    );
    
    let timeout: NodeJS.Timeout;
    const debouncedReload = () => {
        clearTimeout(timeout);
        timeout = setTimeout(activateLogic, 500);
    };
    
    watcher.onDidChange(debouncedReload);
    watcher.onDidCreate(debouncedReload);
    triggerWatcher.onDidChange(debouncedReload);
    triggerWatcher.onDidCreate(debouncedReload);
    
    // Manual reload command
    const reloadCmd = vscode.commands.registerCommand('atomic-flow.reloadFrontend', () => {
        activateLogic();
    });
    
    context.subscriptions.push(watcher, triggerWatcher, reloadCmd);
}

export function deactivate() {
    console.log('Atomic Flow SHELL deactivated');
}
