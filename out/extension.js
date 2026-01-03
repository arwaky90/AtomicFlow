"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// src/extension.ts - FIXED: DeepSeek's singleton pattern with proper dispose
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function activate(context) {
    console.log('🔧 Atomic Flow SHELL activated');
    let currentActivation = null;
    let registeredDisposables = [];
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
                try {
                    d.dispose();
                }
                catch (e) { /* ignore */ }
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
        }
        catch (error) {
            console.error('❌ Hot reload failed:', error);
            vscode.window.showErrorMessage(`Atomic Flow error: ${error.message}`);
        }
    };
    // Initial activation
    activateLogic();
    // Watch for changes in out/ and media/
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(context.extensionUri, '{out,media}/**/*.{js,css,html}'));
    // Watch trigger file
    const triggerWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(context.extensionUri, '.hot-reload-trigger'));
    let timeout;
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
function deactivate() {
    console.log('Atomic Flow SHELL deactivated');
}
//# sourceMappingURL=extension.js.map