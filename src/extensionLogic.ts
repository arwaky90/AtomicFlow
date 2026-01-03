import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AtomicScannerService, SourceFolder } from './services/atomic_scanner_service';
import { AtomicRustAdapter } from './adapters/atomic_rust_adapter';
import { AtomicFileAdapter } from './adapters/atomic_file_adapter';
import { AtomicStorageAdapter } from './adapters/atomic_storage_adapter';
import { AtomicHtmlTemplate } from './adapters/atomic_html_template';

class AtomicUriHandler implements vscode.UriHandler {
    handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
        // e.g. vscode://rakaarwaky.atomic-flow/chat?query=hello
        if (uri.path === '/chat') {
            const queryParams = new URLSearchParams(uri.query);
            const query = queryParams.get('query');

            if (query) {
                // Try to open Agent first, fall back to standard chat
                vscode.commands.executeCommand('workbench.action.chat.openAgent', query).then(
                    () => {},
                    (err) => {
                        console.log('Agent command failed, trying standard chat:', err);
                        // Fallback to standard chat if agent command doesn't exist/fails
                        vscode.commands.executeCommand('workbench.action.chat.open', { query: query });
                    }
                );
            }
        }
    }
}

class AtomicFlowProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'atomic-flow.graphView';
    private _view?: vscode.WebviewView;
    private _currentDepth: number = 1;
    private _cachedData: any = null;
    private _selectedSourceRoot: string = '';
    private _workspaceRoot: string = '';
    
    // Services & Adapters
    private _scanner: AtomicScannerService;
    private _rust: AtomicRustAdapter;
    private _file: AtomicFileAdapter;
    private _storage: AtomicStorageAdapter;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        context: vscode.ExtensionContext
    ) {
        this._scanner = new AtomicScannerService();
        this._rust = new AtomicRustAdapter(_extensionUri);
        this._file = new AtomicFileAdapter();
        this._storage = new AtomicStorageAdapter(context);
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = { 
            enableScripts: true, 
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };
        
        // CRITICAL: Set HTML immediately to prevent white screen
        webviewView.webview.html = AtomicHtmlTemplate.getWebviewHtml(this._extensionUri, webviewView.webview);
        
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'clientReady') {
                this.handleClientReady();
            } else {
                this.handleMessage(message);
            }
        });
    }

    private async handleClientReady() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceRoot || !this._view) return;
        
        this._workspaceRoot = workspaceRoot;
        const cachedRoot = this._storage.getSourceRoot();
        
        if (cachedRoot && fs.existsSync(cachedRoot)) {
            this._selectedSourceRoot = cachedRoot;
            await this.loadGraph();
            return;
        }
        
        const folders = await this._scanner.scanSourceFolders(workspaceRoot);
        if (folders.length === 1) {
            this._selectedSourceRoot = folders[0].path;
            await this._storage.saveSourceRoot(this._selectedSourceRoot);
            await this.loadGraph();
        } else if (folders.length === 0) {
            this._selectedSourceRoot = workspaceRoot;
            await this.loadGraph();
        } else {
            this._view.webview.postMessage({
                command: 'showDashboard',
                folders,
                workspaceRoot,
            });
        }
    }

    private async loadGraph() {
        if (!this._selectedSourceRoot) return;
        try {
            const graphData = await this._rust.invokeRustEngine(this._selectedSourceRoot);
            this._cachedData = {
                command: 'updateGraph',
                data: graphData,
                sourceRoot: this._selectedSourceRoot,
                sourceRootName: path.basename(this._selectedSourceRoot),
            };
            this._view?.webview.postMessage(this._cachedData);
        } catch (error) {
            console.error('[AtomicFlow] Failed to load graph:', error);
        }
    }

    private async handleMessage(message: any) {
        switch (message.command) {
            case 'requestDashboard':
                // Re-scan and show dashboard for folder selection
                const folders = await this._scanner.scanSourceFolders(this._workspaceRoot);
                this._view?.webview.postMessage({
                    command: 'showDashboard',
                    folders,
                    workspaceRoot: this._workspaceRoot,
                });
                break;
            case 'selectSourceRoot':
                this._selectedSourceRoot = message.path;
                await this._storage.saveSourceRoot(message.path);
                await this.loadGraph();
                break;
            case 'clearSourceCache':
                await this._storage.clearCache();
                this._selectedSourceRoot = '';
                await this.handleClientReady();
                break;
            case 'toggleDepth':
                this._currentDepth = message.depth;
                this.refresh();
                break;
            case 'openFile':
                await this._file.openFile(this._workspaceRoot, message.path);
                break;
            case 'getFileContent':
                const content = this._file.getFileContent(this._workspaceRoot, message.path);
                if (content) this._view?.webview.postMessage({ command: 'fileContent', ...content });
                break;
            case 'saveFileContent':
                if (await this._file.saveFileContent(this._workspaceRoot, message.path, message.content)) {
                    this._view?.webview.postMessage({ command: 'fileSaved', path: message.path });
                }
                break;
            case 'createFolder': {
                const newPath = await this._file.createFolder(this._workspaceRoot, message.parentPath, message.name);
                if (newPath) {
                    this._view?.webview.postMessage({ command: 'folderCreated', path: newPath });
                    this.refresh();
                }
                break;
            }
            case 'createFile': {
                const newPath = await this._file.createNode(
                    this._workspaceRoot, 
                    message.parentPath, 
                    message.name,
                    message.content // Pass template content
                );
                if (newPath) {
                    this._view?.webview.postMessage({ command: 'fileCreated', path: newPath });
                    this.refresh();
                }
                break;
            }
            case 'createNode':
                // Legacy support - mapped to createFile
                const legacyPath = await this._file.createNode(this._workspaceRoot, message.directory, message.filename);
                if (legacyPath) {
                    this._view?.webview.postMessage({ command: 'nodeCreated', path: legacyPath });
                    this.refresh();
                }
                break;
            case 'deleteNode':
                const deletedContent = await this._file.deleteNode(this._workspaceRoot, message.path);
                if (deletedContent !== null) {
                    this._view?.webview.postMessage({ command: 'nodeDeleted', path: message.path, previousContent: deletedContent });
                    this.refresh();
                }
                break;
            case 'buildKingdom': {
                // Create hexagonal architecture folders
                const foldersToCreate: string[] = message.folders || [];
                const createdFolders: string[] = [];
                const sourceRoot = this._selectedSourceRoot || this._workspaceRoot;
                
                for (const folder of foldersToCreate) {
                    const fullPath = path.join(sourceRoot, folder);
                    try {
                        if (!fs.existsSync(fullPath)) {
                            fs.mkdirSync(fullPath, { recursive: true });
                            createdFolders.push(folder);
                            console.log(`✅ Created folder: ${folder}`);
                        }
                    } catch (err) {
                        console.error(`❌ Failed to create ${folder}:`, err);
                    }
                }
                
                this._view?.webview.postMessage({ 
                    command: 'kingdomBuilt', 
                    created: createdFolders 
                });
                
                vscode.window.showInformationMessage(
                    `🏰 Kingdom Built! Created ${createdFolders.length} folders`
                );
                
                // Refresh graph to show new folders
                this.refresh();
                break;
            }

            case 'moveNode': {
                // Move file to new location (for AI Agent)
                const oldPath = path.join(this._workspaceRoot, message.oldPath);
                const targetDir = path.join(this._workspaceRoot, message.newDir);
                const fileName = path.basename(message.oldPath);
                const newPath = path.join(targetDir, fileName);

                try {
                    // Ensure target dir exists
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }

                    // Move file
                    fs.renameSync(oldPath, newPath);
                    console.log(`📦 Moved ${message.oldPath} -> ${newPath}`);

                    this._view?.webview.postMessage({ 
                        command: 'nodeMoved', 
                        oldPath: message.oldPath,
                        newPath: message.newDir + '/' + fileName
                    });
                    
                    this.refresh();
                } catch (error: any) {
                    console.error('Move failed:', error);
                    vscode.window.showErrorMessage(`Failed to move file: ${error.message}`);
                }
                break;
            }

            case 'checkHexFolders': {
                const foldersToCheck: string[] = message.folders || [];
                const missingFolders: string[] = [];
                const checkRoot = this._selectedSourceRoot || this._workspaceRoot;
                
                for (const folder of foldersToCheck) {
                    const fullPath = path.join(checkRoot, folder);
                    if (!fs.existsSync(fullPath)) {
                        missingFolders.push(folder);
                    }
                }
                
                this._view?.webview.postMessage({ 
                    command: 'missingHexFolders', 
                    folders: missingFolders 
                });
                break;
            }

            case 'openAgentChat': {
                const query = message.query;
                if (query) {
                    // Execute the Agent Open command directly from the webview message
                     vscode.commands.executeCommand('workbench.action.chat.openAgent', query).then(
                        () => {},
                        (err) => {
                            console.log('Agent command failed, trying standard chat:', err);
                            vscode.commands.executeCommand('workbench.action.chat.open', { query: query });
                        }
                    );
                }
                break;
            }
        }
    }

    public async refresh() {
        if (!this._view) return;
        if (!this._view.webview.html) this._view.webview.html = AtomicHtmlTemplate.getWebviewHtml(this._extensionUri, this._view.webview);
        
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceRoot) {
             this._view.webview.html = AtomicHtmlTemplate.getEmptyHtml();
             return;
        }

        this._workspaceRoot = workspaceRoot;
        if (!this._selectedSourceRoot) this._selectedSourceRoot = this._scanner.detectSourceRoot(workspaceRoot);

        try {
            const graphData = await this._rust.invokeRustEngine(this._selectedSourceRoot);
            this._cachedData = {
                command: 'updateGraph',
                data: graphData,
                currentDepth: this._currentDepth,
                sourceRoot: this._selectedSourceRoot,
                sourceRootName: path.basename(this._selectedSourceRoot),
            };
            this._view.webview.postMessage(this._cachedData);
        } catch (error) {
            console.error("Rust Engine Failed:", error);
        }
    }

    public async focusNodeInGraph(editor: vscode.TextEditor | undefined) {
        if (!this._view || !editor) return;
        
        // Only focus if the file is within the current workspace/source root
        const filePath = editor.document.uri.fsPath;
        if (filePath.startsWith(this._workspaceRoot)) {
            this._view.webview.postMessage({
                command: 'focusNode',
                filePath: filePath
            });
        }
    }
}

let currentProvider: AtomicFlowProvider | null = null;

let refreshTimeout: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    currentProvider = new AtomicFlowProvider(context.extensionUri, context);
    
    // Register URI Handler
    context.subscriptions.push(
        vscode.window.registerUriHandler(new AtomicUriHandler())
    );
    
    const debouncedRefresh = () => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            currentProvider?.refresh();
        }, 500); // 500ms debounce
    };

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(AtomicFlowProvider.viewType, currentProvider),
        // On active editor change, JUST focus the node, don't reload data!
        vscode.window.onDidChangeActiveTextEditor((editor) => currentProvider?.focusNodeInGraph(editor)),
        // On save, reload data (debounced)
        vscode.workspace.onDidSaveTextDocument(() => debouncedRefresh()),
        vscode.commands.registerCommand('atomic-flow.refresh', () => currentProvider?.refresh())
    );
}

export function deactivate() {
    currentProvider = null;
}

export function refreshWebviews(context: vscode.ExtensionContext) {
    if (currentProvider) currentProvider.refresh();
}
