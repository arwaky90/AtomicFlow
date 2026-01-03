import * as vscode from 'vscode';

export class AtomicHtmlTemplate {
    public static getEmptyHtml(): string {
        return `
            <html>
            <body style="background:#1e1e1e;color:#fff;font-family:system-ui;padding:20px;">
                <h3>⚛️ Atomic Flow</h3>
                <p>Open a workspace to start.</p>
            </body>
            </html>
        `;
    }

    public static getWebviewHtml(extensionUri: vscode.Uri, webview: vscode.Webview): string {
        const mediaUri = vscode.Uri.joinPath(extensionUri, 'media');
        const nonce = new Date().getTime();
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'index.css')).toString() + `?t=${nonce}`;
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'main.js')).toString() + `?t=${nonce}`;
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Atomic Flow</title>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="root"></div>
                <script>
                    const vscode = acquireVsCodeApi();
                    window.vscode = vscode;
                    vscode.postMessage({ command: 'clientReady' });
                </script>
                <script type="module" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}
