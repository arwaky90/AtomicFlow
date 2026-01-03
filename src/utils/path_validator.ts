/**
 * path_validator.ts
 * Security utility for validating file paths within workspace.
 */
import * as path from 'path'

// ============================================================
// TYPES
// ============================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitizedPath?: string
}

// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.vue', '.js', '.jsx', 
  '.css', '.scss', '.json', '.md', '.yaml', '.yml'
]

const FORBIDDEN_PATTERNS = [
  /\.\./,           // Path traversal
  /node_modules/,   // Dependencies
  /\.git/,          // Version control
  /\.env/,          // Environment files
  /\.vscode/,       // Editor config
]

// ============================================================
// VALIDATION
// ============================================================

export function validatePath(
  inputPath: string,
  workspaceRoot: string,
  srcFolder: string = 'src'
): ValidationResult {
  // 1. Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(inputPath)) {
      return { valid: false, error: `Forbidden pattern detected` }
    }
  }

  // 2. Normalize and resolve
  const normalizedPath = path.normalize(inputPath)
  const fullPath = path.resolve(workspaceRoot, normalizedPath)
  const srcPath = path.resolve(workspaceRoot, srcFolder)

  // 3. Ensure within src directory
  if (!fullPath.startsWith(srcPath)) {
    return { valid: false, error: 'Path must be within src directory' }
  }

  // 4. Check extension
  const ext = path.extname(fullPath).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Extension not allowed: ${ext}` }
  }

  return { valid: true, sanitizedPath: fullPath }
}

export function isPathSafe(fullPath: string, workspaceRoot: string): boolean {
  const srcPath = path.resolve(workspaceRoot, 'src')
  return fullPath.startsWith(srcPath) || fullPath.startsWith(workspaceRoot)
}

export function resolveWorkspacePath(
  relativePath: string,
  workspaceRoot: string
): string {
  return path.resolve(workspaceRoot, relativePath)
}
