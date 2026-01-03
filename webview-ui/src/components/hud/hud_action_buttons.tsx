/**
 * HudActionButtons
 * Presentational component for clipboard copy and screenshot buttons.
 */

import { Copy, Camera, Check } from 'lucide-react';

interface HudActionButtonsProps {
  /** Whether content was recently copied (shows checkmark) */
  copied: boolean;
  /** Handler for copy button click */
  onCopy: () => void;
  /** Handler for screenshot button click */
  onScreenshot: () => void;
}

/**
 * Action buttons for clipboard and screenshot operations.
 */
export function HudActionButtons({ copied, onCopy, onScreenshot }: HudActionButtonsProps) {
  const buttonClass = `
    p-2.5 
    bg-[hsl(216_28%_12%/0.7)] 
    backdrop-blur-md 
    border border-[hsl(210_15%_25%/0.4)] 
    rounded-xl 
    hover:border-[hsl(195_50%_50%/0.4)] 
    hover:shadow-[0_0_15px_rgba(107,177,198,0.15)] 
    text-[hsl(210_10%_60%)] 
    hover:text-[hsl(210_20%_85%)] 
    transition-all duration-200
  `;

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onCopy}
        className={buttonClass}
        title="Copy Graph to Clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-[hsl(150_60%_50%)]" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      <button 
        onClick={onScreenshot}
        className={buttonClass}
        title="Take Screenshot"
      >
        <Camera className="w-4 h-4" />
      </button>
    </div>
  );
}
