import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class AtomicFileAdapter {
    /** open file in IDE */
    public async openFile(workspaceRoot: string, relativePath: string) {
        const fullPath = path.join(workspaceRoot, relativePath);
        try {
            const doc = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(doc);
        } catch (err) {
            console.error("Could not open file", fullPath, err);
        }
    }

    /** Save file content */
    public async saveFileContent(workspaceRoot: string, relativePath: string, content: string): Promise<boolean> {
        const fullPath = path.join(workspaceRoot, relativePath);
        try {
            fs.writeFileSync(fullPath, content, 'utf-8');
            vscode.window.showInformationMessage(`Saved: ${path.basename(fullPath)}`);
            return true;
        } catch (error: any) {
            console.error('Failed to save file:', error);
            vscode.window.showErrorMessage(`Failed to save: ${error.message}`);
            return false;
        }
    }

    /** Create new folder */
    public async createFolder(workspaceRoot: string, parentPath: string, folderName: string): Promise<string | null> {
        const fullPath = path.join(workspaceRoot, parentPath, folderName);
        try {
            if (fs.existsSync(fullPath)) {
                vscode.window.showErrorMessage(`Folder already exists: ${folderName}`);
                return null;
            }
            fs.mkdirSync(fullPath, { recursive: true });
            return path.join(parentPath, folderName);
        } catch (error: any) {
            console.error('Failed to create folder:', error);
            vscode.window.showErrorMessage(`Failed to create folder: ${error.message}`);
            return null;
        }
    }

    /** Create new file (node) */
    public async createNode(workspaceRoot: string, directory: string, filename: string, content?: string): Promise<string | null> {
        const fullPath = path.join(workspaceRoot, directory, filename);
        try {
            if (fs.existsSync(fullPath)) {
                vscode.window.showErrorMessage(`File already exists: ${filename}`);
                return null;
            }

            // Use provided content or fallback to defaults
            let fileContent = content;
            
            if (!fileContent) {
                const ext = path.extname(filename).toLowerCase();
                if (ext === '.ts' || ext === '.tsx') {
                    fileContent = `// ${filename}\nexport {};\n`;
                } else if (ext === '.vue') {
                    fileContent = `<template>\n  <div></div>\n</template>\n\n<script setup lang="ts">\n</script>\n`;
                } else {
                    fileContent = '';
                }
            }
            
            fs.writeFileSync(fullPath, fileContent, 'utf-8');
            return path.join(directory, filename);
        } catch (error: any) {
            console.error('Failed to create file:', error);
            vscode.window.showErrorMessage(`Failed to create: ${error.message}`);
            return null;
        }
    }

    /** Delete node */
    public async deleteNode(workspaceRoot: string, relativePath: string): Promise<string | null> {
        const fullPath = path.join(workspaceRoot, relativePath);
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            fs.unlinkSync(fullPath);
            return content;
        } catch (error: any) {
            console.error('Failed to delete file:', error);
            vscode.window.showErrorMessage(`Failed to delete: ${error.message}`);
            return null;
        }
    }

    /** Send file content for editor */
    public getFileContent(workspaceRoot: string, relativePath: string) {
        const fullPath = path.join(workspaceRoot, relativePath);
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            return {
                content,
                filePath: relativePath, // Return relative path to match frontend node.data.path
                fileName: path.basename(fullPath)
            };
        } catch (error: any) {
            console.error('Failed to read file:', error);
            return null;
        }
    }
}
