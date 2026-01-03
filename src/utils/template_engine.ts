/**
 * template_engine.ts
 * Code template generator for creating new files.
 */

// ============================================================
// TYPES
// ============================================================

export type TemplateType = 
  | 'vue-component'
  | 'composable'
  | 'domain-entity'
  | 'adapter'
  | 'test'

// ============================================================
// TEMPLATES
// ============================================================

const TEMPLATES: Record<TemplateType, (name: string) => string> = {
  'vue-component': (name) => `<template>
  <div class="${name.toLowerCase()}">
    <!-- ${name} Component -->
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  // Define props here
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  // Define events here
}>()
</script>

<style scoped>
.${name.toLowerCase()} {
  /* Component styles */
}
</style>
`,

  'composable': (name) => `import { ref, computed } from 'vue'

/**
 * ${name} Composable
 */
export function ${name}() {
  // State
  const state = ref()

  // Actions
  const action = () => {
    // Implementation
  }

  // Getters
  const getter = computed(() => state.value)

  return {
    state,
    action,
    getter
  }
}
`,

  'domain-entity': (name) => `/**
 * ${name} Entity
 */
export interface I${name} {
  id: string
  // Define properties
}

export class ${name} implements I${name} {
  constructor(
    public readonly id: string,
  ) {}

  // Domain methods
}
`,

  'adapter': (name) => `/**
 * ${name} Adapter
 */
export class ${name}Adapter {
  constructor() {}

  // Implement methods
}
`,

  'test': (name) => `import { describe, it, expect } from 'vitest'

describe('${name}', () => {
  it('should work correctly', () => {
    expect(true).toBe(true)
  })
})
`
}

// ============================================================
// GENERATOR
// ============================================================

export function generateTemplate(type: TemplateType, name: string): string {
  const generator = TEMPLATES[type]
  if (!generator) {
    throw new Error(`Unknown template type: ${type}`)
  }
  return generator(name)
}

export function inferTemplateName(filePath: string): string {
  const basename = filePath.split('/').pop() || 'Component'
  return basename.replace(/\.(vue|ts|tsx|js|jsx)$/, '')
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

export function detectTemplateType(filePath: string): TemplateType {
  if (filePath.endsWith('.vue')) return 'vue-component'
  if (filePath.includes('composables') || filePath.startsWith('use')) return 'composable'
  if (filePath.includes('domain') || filePath.includes('entities')) return 'domain-entity'
  if (filePath.includes('adapters')) return 'adapter'
  if (filePath.includes('.spec.') || filePath.includes('.test.')) return 'test'
  return 'composable'
}
