/**
 * Language Utilities - File extension to language mapping
 * Extracted from code_editor_panel.tsx
 */

/**
 * Get CSS class for syntax highlighting based on file extension
 */
export function getLanguageClass(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'language-typescript';
    case 'js':
    case 'jsx':
      return 'language-javascript';
    case 'json':
      return 'language-json';
    case 'css':
      return 'language-css';
    case 'html':
      return 'language-html';
    case 'vue':
      return 'language-vue';
    case 'rs':
      return 'language-rust';
    case 'py':
      return 'language-python';
    case 'md':
      return 'language-markdown';
    case 'yaml':
    case 'yml':
      return 'language-yaml';
    default:
      return 'language-plaintext';
  }
}

/**
 * Get human-readable language name from file extension
 */
export function getLanguageName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const languageNames: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript React',
    js: 'JavaScript',
    jsx: 'JavaScript React',
    json: 'JSON',
    css: 'CSS',
    html: 'HTML',
    vue: 'Vue',
    rs: 'Rust',
    py: 'Python',
    md: 'Markdown',
    yaml: 'YAML',
    yml: 'YAML',
  };
  
  return languageNames[ext || ''] || 'Plain Text';
}
