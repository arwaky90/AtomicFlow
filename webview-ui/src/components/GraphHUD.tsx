/**
 * GraphHUD - Premium glassmorphism overlay controls
 * 
 * Layout: 
 *   Top Row: Search (center)
 *   Second Row: Build Kingdom + AI Agent (center) - if applicable
 *   Third Row: Brand (left) | Breadcrumb (center) | Actions (right)
 *   Bottom Row: Status (left) | Mode Switcher (center)
 * 
 * This component is now purely orchestration, delegating:
 * - State management → useGraphHudState hook
 * - UI rendering → HUD sub-components
 */

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { BreadcrumbNav } from './BreadcrumbNav';
import { useGraphHudState } from '@/composables/use_graph_hud_state';
import { BuildKingdomButton } from '@/components/ui/build_kingdom_button';
import { AiAgentButton } from '@/components/ui/ai_agent';
import {
  HudBrandSection,
  HudActionButtons,
  HudModeSwitcher,
  HudStatusBar,
} from './hud';

interface GraphHUDProps {
  mode: 'DIRECTORY' | 'DEPENDENCY';
  onModeChange: (mode: 'DIRECTORY' | 'DEPENDENCY') => void;
  nodeCount?: number;
}

/**
 * GraphHUD - Main overlay control panel for the graph visualizer.
 */
export function GraphHUD({ mode, onModeChange, nodeCount = 0 }: GraphHUDProps) {
  const { missingFolders, copied, isAnalyzing, actions } = useGraphHudState();

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      
      {/* --- TOP LEFT: BRAND --- */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <HudBrandSection />
      </div>

      {/* --- TOP RIGHT: ACTIONS --- */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <HudActionButtons 
          copied={copied} 
          onCopy={actions.copyToClipboard} 
          onScreenshot={actions.takeScreenshot} 
        />
      </div>

      {/* --- TOP CENTER: SEARCH & TOOLS & BREADCRUMB --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-2xl pointer-events-auto">
        
        {/* Search Bar */}
        <div className="relative group w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(210_10%_40%)] group-hover:text-[hsl(195_50%_55%)] transition-colors duration-200" />
          <Input 
            placeholder="Search nodes..." 
            className="w-full h-8 pl-9 pr-4 bg-[hsl(216_28%_10%/0.6)] backdrop-blur-md border-[hsl(210_15%_20%/0.4)] focus:border-[hsl(195_50%_50%/0.5)] focus:shadow-[0_0_15px_rgba(107,177,198,0.15)] transition-all duration-200 rounded-full text-xs text-[hsl(210_20%_85%)] placeholder:text-[hsl(210_10%_40%)]" 
          />
        </div>

        {/* Build / Agent Buttons */}
        {(missingFolders.length > 0 || mode === 'DEPENDENCY') && (
          <div className="flex justify-center items-center gap-3">
            {missingFolders.length > 0 && (
              <BuildKingdomButton 
                missingFolders={missingFolders} 
                label={mode === 'DIRECTORY' ? 'Set Up Folder' : 'Build Kingdom'}
                variant={mode === 'DIRECTORY' ? 'setup' : 'kingdom'}
              />
            )}
            {mode === 'DEPENDENCY' && (
              <AiAgentButton 
                onAnalyze={actions.handleAiAnalysis} 
                isAnalyzing={isAnalyzing} 
              />
            )}
          </div>
        )}

        {/* Breadcrumb - Only in Directory Mode */}
        {mode === 'DIRECTORY' && <BreadcrumbNav />}
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto">
        <HudStatusBar 
          nodeCount={nodeCount}
          mode={mode}
          missingFolders={missingFolders}
          isAnalyzing={isAnalyzing}
          onAiAnalysis={actions.handleAiAnalysis}
        />

        <HudModeSwitcher mode={mode} onModeChange={onModeChange} />

        {/* Spacer for balance */}
        <div className="w-[140px]" />
      </div>

    </div>
  );
}
