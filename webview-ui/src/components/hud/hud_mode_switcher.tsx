/**
 * HudModeSwitcher
 * Presentational component for Directory/Dependency mode toggle.
 */

import { motion } from 'framer-motion';
import { Folder, Layers } from 'lucide-react';

type ViewMode = 'DIRECTORY' | 'DEPENDENCY';

interface HudModeSwitcherProps {
  /** Current active mode */
  mode: ViewMode;
  /** Handler for mode change */
  onModeChange: (mode: ViewMode) => void;
}

/**
 * Animated mode switcher with pill indicator.
 */
export function HudModeSwitcher({ mode, onModeChange }: HudModeSwitcherProps) {
  const getButtonClass = (buttonMode: ViewMode) => `
    relative z-10 px-5 py-2 text-sm font-medium transition-all duration-200 rounded-full
    ${mode === buttonMode 
      ? 'text-[hsl(215_28%_8%)]' 
      : 'text-[hsl(210_10%_50%)] hover:text-[hsl(210_15%_70%)]'
    }
  `;

  const pillMotion = (
    <motion.div
      layoutId="mode-pill"
      className="absolute inset-0 bg-gradient-to-r from-[hsl(195_55%_50%)] to-[hsl(200_50%_55%)] rounded-full -z-10 shadow-[0_0_20px_rgba(107,177,198,0.35)]"
      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
    />
  );

  return (
    <div className="flex items-center p-1 bg-[hsl(216_28%_10%/0.7)] backdrop-blur-xl border border-[hsl(210_15%_22%/0.4)] shadow-[0_4px_24px_rgba(0,0,0,0.4)] rounded-full">
      <div className="relative flex">
        <button
          onClick={() => onModeChange('DIRECTORY')}
          className={getButtonClass('DIRECTORY')}
        >
          <span className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Directory
          </span>
          {mode === 'DIRECTORY' && pillMotion}
        </button>

        <button
          onClick={() => onModeChange('DEPENDENCY')}
          className={getButtonClass('DEPENDENCY')}
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Dependency
          </span>
          {mode === 'DEPENDENCY' && pillMotion}
        </button>
      </div>
    </div>
  );
}
