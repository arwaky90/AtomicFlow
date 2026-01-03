/**
 * vscode.ts - Type-safe VS Code Webview API wrapper
 */

export interface VSCodeWebviewApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// Declare the function injected by VS Code
declare function acquireVsCodeApi(): VSCodeWebviewApi;

class VSCodeAPIWrapper {
  private readonly vsCodeApi: VSCodeWebviewApi | undefined;

  constructor() {
    // Check if running in VS Code Webview
    if (typeof acquireVsCodeApi === 'function') {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  /**
   * Post a message to the extension
   * @param message The payload to send
   */
  public postMessage(message: unknown): void {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log('Extensions -> Webview message:', message);
    }
  }

  /**
   * Get the persistent state
   */
  public getState(): unknown {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    }
    return {};
  }

  /**
   * Set the persistent state
   */
  public setState(state: unknown): void {
    if (this.vsCodeApi) {
      this.vsCodeApi.setState(state);
    }
  }
}

// Export a singleton instance
export const vscode = new VSCodeAPIWrapper();
