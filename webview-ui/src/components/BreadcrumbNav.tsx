import { ChevronRight, Home, FolderOpen, ArrowUp } from 'lucide-react';
import { useFolderStore } from '@/store/folder_navigation_store';

/**
 * BreadcrumbNav - Premium glassmorphism breadcrumb navigation
 * Shows current path within detected source root
 */
export function BreadcrumbNav() {
  const { 
    sourceRootName, 
    folderStack,
    navigateTo,
    navigateUp,
    goToDashboard,
  } = useFolderStore();

  // Build breadcrumb segments from folder stack
  // Filter out segments that match sourceRootName to avoid duplication
  // (sourceRootName is already displayed separately above)
  const segments = folderStack.length > 0 
    ? folderStack.filter(seg => seg !== sourceRootName && seg !== '')
    : [];

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-[hsl(216_28%_10%/0.6)] backdrop-blur-xl border border-[hsl(210_15%_20%/0.35)] rounded-full text-sm shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      {/* Home/Dashboard Button - Returns to folder selection */}
      <button
        className="flex items-center justify-center w-7 h-7 rounded-lg text-[hsl(210_10%_55%)] hover:text-[hsl(210_20%_85%)] hover:bg-[hsl(216_20%_18%/0.5)] transition-all duration-150"
        onClick={() => goToDashboard?.()}
        title="Return to Dashboard (Select another folder)"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {/* Source Root Name */}
      <button
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[hsl(210_10%_55%)] hover:text-[hsl(210_20%_85%)] hover:bg-[hsl(216_20%_18%/0.5)] transition-all duration-150"
        onClick={() => navigateTo('')}
        title="Go to source root"
      >
        <span className="font-medium text-[hsl(195_50%_60%)]">{sourceRootName || 'src'}</span>
      </button>

      {/* Breadcrumb Trail */}
      {segments.length > 0 && segments[0] !== '' && segments.map((segment, index) => {
        const segmentName = segment.split('/').pop() || segment;
        const isLast = index === segments.length - 1;
        
        return (
          <div key={segment} className="flex items-center">
            <ChevronRight className="w-3 h-3 text-[hsl(210_10%_35%)] mx-0.5" />
            <button
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg transition-all duration-150 ${
                isLast 
                  ? 'text-[hsl(210_20%_90%)] font-medium cursor-default' 
                  : 'text-[hsl(210_10%_55%)] hover:text-[hsl(210_20%_85%)] hover:bg-[hsl(216_20%_18%/0.5)]'
              }`}
              onClick={() => !isLast && navigateTo(segment)}
              disabled={isLast}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[hsl(45_60%_55%)]" />
              <span>{segmentName}</span>
            </button>
          </div>
        );
      })}

      {/* Up Button (only show if we can go up) */}
      {folderStack.length > 0 && (
        <>
          <div className="h-4 w-px bg-[hsl(210_15%_20%/0.5)] mx-2" />
          <button
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[hsl(210_10%_50%)] hover:text-[hsl(210_20%_85%)] hover:bg-[hsl(216_20%_18%/0.5)] transition-all duration-150"
            onClick={navigateUp}
            title="Go up one level"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Up</span>
          </button>
        </>
      )}
    </div>
  );
}
