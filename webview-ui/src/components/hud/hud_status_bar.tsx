/**
 * HudStatusBar
 * Presentational component for status indicator and node count.
 * Action buttons (Build Kingdom, AI Agent) are now in the top section.
 */

type ViewMode = 'DIRECTORY' | 'DEPENDENCY';

interface HudStatusBarProps {
  /** Number of nodes in the graph */
  nodeCount: number;
  /** Current view mode */
  mode: ViewMode;
  /** List of missing hexagonal folder paths - kept for compatibility */
  missingFolders?: string[];
  /** Whether AI analysis is in progress - kept for compatibility */
  isAnalyzing?: boolean;
  /** Handler for AI analysis button click - kept for compatibility */
  onAiAnalysis?: () => void;
}

/**
 * Status bar showing node count and ready status.
 */
export function HudStatusBar({ 
  nodeCount, 
}: HudStatusBarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Status Pill */}
      <div className="px-4 py-2 bg-[hsl(216_28%_10%/0.7)] backdrop-blur-xl border border-[hsl(210_15%_20%/0.35)] rounded-full flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[hsl(150_60%_50%)] shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          <span className="text-xs font-medium text-[hsl(210_10%_55%)]">Ready</span>
        </div>
        <div className="h-4 w-px bg-[hsl(210_15%_20%/0.6)]" />
        <span className="text-xs font-mono text-[hsl(210_10%_55%)]">
          <span className="text-[hsl(195_50%_60%)]">{nodeCount}</span> Nodes
        </span>
      </div>
    </div>
  );
}
