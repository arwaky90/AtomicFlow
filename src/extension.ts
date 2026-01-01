import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { buildGraph } from './graphBuilder';

class PythonLiveProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'atomic-flow.graphView';
    private _view?: vscode.WebviewView;
    private _currentDepth: number = 1;
    private _cachedData: any = null;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = { 
            enableScripts: true, 
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };
        
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'clientReady') {
                if (this._cachedData) {
                    this._view?.webview.postMessage(this._cachedData);
                }
            } else {
                this.handleMessage(message);
            }
        });
        
        this.refresh();
    }

    private async handleMessage(message: any) {
        switch (message.command) {
            case 'toggleDepth':
                this._currentDepth = message.depth;
                this.refresh();
                break;
            case 'openFile':
                await this.openFile(message.path);
                break;
            case 'copyImage':
                await this.copyImageToClipboard(message.data);
                break;
            case 'saveImage':
                await this.saveImage(message.data);
                break;
        }
    }


    private async openFile(relativePath: string) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (workspaceRoot) {
            const fullPath = path.join(workspaceRoot, relativePath);
            try {
                const doc = await vscode.workspace.openTextDocument(fullPath);
                await vscode.window.showTextDocument(doc);
            } catch (err) {
                console.error("Could not open file", fullPath, err);
            }
        }
    }

    private async copyImageToClipboard(data: number[]) {
        // VS Code webview doesn't have direct clipboard access for images
        // So we save temp file and notify user
        const tmpPath = path.join(require('os').tmpdir(), 'python-live-graph.png');
        fs.writeFileSync(tmpPath, Buffer.from(data));
        vscode.window.showInformationMessage(`Graph saved to ${tmpPath}. You can now copy it!`, 'Open')
            .then(selection => {
                if (selection === 'Open') {
                    vscode.env.openExternal(vscode.Uri.file(tmpPath));
                }
            });
    }

    private async saveImage(data: number[]) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('dependency-graph.png'),
            filters: { 'Images': ['png'] }
        });
        
        if (uri) {
            fs.writeFileSync(uri.fsPath, Buffer.from(data));
            vscode.window.showInformationMessage(`Graph saved to ${uri.fsPath}`);
        }
    }

    public refresh() {
        if (!this._view) return;
        
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.py')) {
            this._view.webview.html = this.getEmptyHtml();
            return;
        }
        
        const filePath = editor.document.fileName;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || path.dirname(filePath);
        const graph = buildGraph(filePath, workspaceRoot, this._currentDepth);
        const rootName = path.basename(filePath);
        
        
        this._view.webview.html = this.getWebviewHtml();
        
        // Cache data and wait for 'clientReady'
        this._cachedData = {
            command: 'renderGraph',
            graph: graph,
            rootFile: rootName,
            currentDepth: this._currentDepth
        };
    }

    private getEmptyHtml(): string {
        return `
            <html>
            <body style="background:#1e1e1e;color:#fff;font-family:system-ui;padding:20px;">
                <h3>⚛️ Atomic Flow</h3>
                <p>Open a Python file to start.</p>
            </body>
            </html>
        `;
    }

    private getWebviewHtml(): string {
        if (!this._view) return '';
        
        const mediaUri = vscode.Uri.joinPath(this._extensionUri, 'media');
        const styleUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'style.css'));
        const scriptUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'main.js'));
        const d3Uri = 'https://d3js.org/d3.v7.min.js';
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._view.webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline' ${this._view.webview.cspSource} https://d3js.org; img-src data:;">
                <script src="${d3Uri}"></script>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="header">
                    <div>
                        <h3 id="title">⚛️ Atomic Flow</h3>
                        <p id="stats">0 nodes · 0 links</p>
                    </div>
                    <div id="controls">
                        <button id="toggleDepth">Direct Only</button>
                        <input type="text" id="searchBox" placeholder="Search..." />
                        <button id="exportBtn">📸 Export</button>
                        <button id="copyBtn">📋 Copy</button>
                    </div>
                </div>
                <div id="status">Click node to open | Alt+Click for impact | Right-click to focus</div>
                <svg></svg>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const provider = new PythonLiveProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(PythonLiveProvider.viewType, provider),
        vscode.window.onDidChangeActiveTextEditor(() => provider.refresh()),
        vscode.workspace.onDidSaveTextDocument(() => provider.refresh()),
        vscode.commands.registerCommand('atomic-flow.refresh', () => provider.refresh())
    );
}

export function deactivate() {}
