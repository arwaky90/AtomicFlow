/**
 * file_templates.ts - File template configurations
 * Defines boilerplate for different file types when creating new files
 */

export type FileLanguage = 
  | 'ts' | 'tsx' | 'js' | 'jsx' | 'mjs' | 'cjs'  // JavaScript/TypeScript
  | 'vue'                                          // Vue
  | 'rs'                                           // Rust
  | 'json' | 'md';                                 // Data/Doc

export interface FileTemplate {
  extension: FileLanguage;
  label: string;
  emoji: string;
  category: 'javascript' | 'typescript' | 'vue' | 'rust' | 'other';
  defaultContent: (fileName: string) => string;
}

/** Get file name without extension */
const getBaseName = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, '');
};

/** Convert file name to PascalCase for components */
const toPascalCase = (str: string): string => {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

/** Convert file name to camelCase */
const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

/** All supported file templates */
export const FILE_TEMPLATES: FileTemplate[] = [
  // TypeScript
  {
    extension: 'ts',
    label: 'TypeScript',
    emoji: '🔷',
    category: 'typescript',
    defaultContent: (name) => `/**
 * ${getBaseName(name)}
 */

export function ${toCamelCase(getBaseName(name))}() {
  // TODO: Implement
}
`,
  },
  {
    extension: 'tsx',
    label: 'React Component (TSX)',
    emoji: '⚛️',
    category: 'typescript',
    defaultContent: (name) => `/**
 * ${toPascalCase(getBaseName(name))} Component
 */

interface ${toPascalCase(getBaseName(name))}Props {
  // Add props here
}

export function ${toPascalCase(getBaseName(name))}({ }: ${toPascalCase(getBaseName(name))}Props) {
  return (
    <div>
      <h1>${toPascalCase(getBaseName(name))}</h1>
    </div>
  );
}
`,
  },

  // JavaScript
  {
    extension: 'js',
    label: 'JavaScript',
    emoji: '🟨',
    category: 'javascript',
    defaultContent: (name) => `/**
 * ${getBaseName(name)}
 */

export function ${toCamelCase(getBaseName(name))}() {
  // TODO: Implement
}
`,
  },
  {
    extension: 'jsx',
    label: 'React Component (JSX)',
    emoji: '⚛️',
    category: 'javascript',
    defaultContent: (name) => `/**
 * ${toPascalCase(getBaseName(name))} Component
 */

export function ${toPascalCase(getBaseName(name))}(props) {
  return (
    <div>
      <h1>${toPascalCase(getBaseName(name))}</h1>
    </div>
  );
}
`,
  },
  {
    extension: 'mjs',
    label: 'ES Module (.mjs)',
    emoji: '📦',
    category: 'javascript',
    defaultContent: (name) => `/**
 * ${getBaseName(name)} - ES Module
 */

export const ${toCamelCase(getBaseName(name))} = {};
`,
  },
  {
    extension: 'cjs',
    label: 'CommonJS (.cjs)',
    emoji: '📦',
    category: 'javascript',
    defaultContent: (name) => `/**
 * ${getBaseName(name)} - CommonJS Module
 */

module.exports = {
  // Exports here
};
`,
  },

  // Vue
  {
    extension: 'vue',
    label: 'Vue Component',
    emoji: '💚',
    category: 'vue',
    defaultContent: (name) => `<script setup lang="ts">
/**
 * ${toPascalCase(getBaseName(name))} Component
 */

// Props
interface Props {
  // Add props here
}

defineProps<Props>();
</script>

<template>
  <div class="${getBaseName(name)}">
    <h1>${toPascalCase(getBaseName(name))}</h1>
  </div>
</template>

<style scoped>
.${getBaseName(name)} {
  /* Styles here */
}
</style>
`,
  },

  // Rust
  {
    extension: 'rs',
    label: 'Rust Module',
    emoji: '🦀',
    category: 'rust',
    defaultContent: (name) => `//! ${getBaseName(name)} module

/// Main struct for ${toPascalCase(getBaseName(name))}
pub struct ${toPascalCase(getBaseName(name))} {
    // Fields here
}

impl ${toPascalCase(getBaseName(name))} {
    /// Create a new instance
    pub fn new() -> Self {
        Self {
            // Initialize fields
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new() {
        let _instance = ${toPascalCase(getBaseName(name))}::new();
    }
}
`,
  },

  // Other
  {
    extension: 'json',
    label: 'JSON',
    emoji: '📋',
    category: 'other',
    defaultContent: () => `{
  
}
`,
  },
  {
    extension: 'md',
    label: 'Markdown',
    emoji: '📝',
    category: 'other',
    defaultContent: (name) => `# ${toPascalCase(getBaseName(name))}

## Overview

TODO: Add description

## Usage

\`\`\`typescript
// Example usage
\`\`\`
`,
  },
];

/** Get template by extension */
export function getTemplateByExtension(ext: FileLanguage): FileTemplate | undefined {
  return FILE_TEMPLATES.find(t => t.extension === ext);
}

/** Get templates grouped by category */
export function getTemplatesByCategory(): Record<string, FileTemplate[]> {
  return FILE_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, FileTemplate[]>);
}

/** Default extensions for quick create */
export const QUICK_CREATE_EXTENSIONS: FileLanguage[] = ['ts', 'tsx', 'rs', 'vue'];
