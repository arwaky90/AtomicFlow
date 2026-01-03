import { FileText, FileCode, FileJson, Braces } from 'lucide-react';

/** Complexity Line Count Heatmap Colors */
export const COMPLEXITY_COLORS = {
  ideal: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },    // < 200 lines
  moderate: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' }, // 200 - 300 lines
  warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' }, // 300 - 500 lines
  danger: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },      // > 500 lines
} as const;

export type ComplexityLevel = keyof typeof COMPLEXITY_COLORS;

/** Determine color based on line count complexity */
export const getComplexityColor = (lineCount: number): ComplexityLevel => {
  if (lineCount < 200) return 'ideal';
  if (lineCount < 300) return 'moderate';
  if (lineCount < 500) return 'warning';
  return 'danger';
};

/** File Extension to Icon mapping (View Helper) */
export const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return FileCode;
    case 'json':
      return FileJson;
    case 'vue':
      return Braces;
    default:
      return FileText;
  }
};
