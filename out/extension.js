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
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const graphBuilder_1 = require("./graphBuilder");
const parsers_1 = require("./parsers");
class PythonLiveProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this._currentDepth = 1;
        this._cachedData = null;
    }
    resolveWebviewView(webviewView) {
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
            }
            else {
                this.handleMessage(message);
            }
        });
        this.refresh();
    }
    async handleMessage(message) {
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
    async openFile(relativePath) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (workspaceRoot) {
            const fullPath = path.join(workspaceRoot, relativePath);
            try {
                const doc = await vscode.workspace.openTextDocument(fullPath);
                await vscode.window.showTextDocument(doc);
            }
            catch (err) {
                console.error("Could not open file", fullPath, err);
            }
        }
    }
    async copyImageToClipboard(data) {
        // VS Code webview doesn't have direct clipboard access for images
        // So we save temp file and notify user
        const tmpPath = path.join(require('os').tmpdir(), 'atomic-flow-graph.png');
        fs.writeFileSync(tmpPath, Buffer.from(data));
        vscode.window.showInformationMessage(`Graph saved to ${tmpPath}. You can now copy it!`, 'Open')
            .then(selection => {
            if (selection === 'Open') {
                vscode.env.openExternal(vscode.Uri.file(tmpPath));
            }
        });
    }
    async saveImage(data) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('dependency-graph.png'),
            filters: { 'Images': ['png'] }
        });
        if (uri) {
            fs.writeFileSync(uri.fsPath, Buffer.from(data));
            vscode.window.showInformationMessage(`Graph saved to ${uri.fsPath}`);
        }
    }
    refresh() {
        if (!this._view)
            return;
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._view.webview.html = this.getEmptyHtml();
            return;
        }
        const filePath = editor.document.fileName;
        const ext = path.extname(filePath);
        // Check if file type is supported
        if (!parsers_1.ParserFactory.getParser(ext)) {
            this._view.webview.html = this.getEmptyHtml();
            return;
        }
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || path.dirname(filePath);
        const graph = (0, graphBuilder_1.buildGraph)(filePath, workspaceRoot, this._currentDepth);
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
    getEmptyHtml() {
        return `
            <html>
            <body style="background:#1e1e1e;color:#fff;font-family:system-ui;padding:20px;">
                <h3>⚛️ Atomic Flow</h3>
                <p>Open a Python file to start.</p>
            </body>
            </html>
        `;
    }
    getWebviewHtml() {
        if (!this._view)
            return '';
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
PythonLiveProvider.viewType = 'atomic-flow.graphView';
function activate(context) {
    const provider = new PythonLiveProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(PythonLiveProvider.viewType, provider), vscode.window.onDidChangeActiveTextEditor(() => provider.refresh()), vscode.workspace.onDidSaveTextDocument(() => provider.refresh()), vscode.commands.registerCommand('atomic-flow.refresh', () => provider.refresh()));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map