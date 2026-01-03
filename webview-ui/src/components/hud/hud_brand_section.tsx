/**
 * HudBrandSection
 * Presentational component for brand logo and version display.
 */

import AtomicFlowLogo from '@/assets/atomic-flow-logo.svg';
import { HUD_CONFIG } from '@/domain/hud';

/**
 * Displays the Atomic Flow brand logo and version.
 */
export function HudBrandSection() {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-[hsl(195_50%_45%/0.1)] backdrop-blur-md border border-[hsl(195_40%_50%/0.2)] shadow-[0_0_20px_rgba(107,177,198,0.08)]">
        <img src={AtomicFlowLogo} alt="Atomic Flow" className="w-5 h-5" />
      </div>
      <div>
        <h1 className="font-semibold text-sm text-[hsl(210_20%_92%)] tracking-tight leading-tight">
          Atomic Flow
        </h1>
        <p className="text-[9px] text-[hsl(210_10%_45%)] font-mono tracking-wider">
          {HUD_CONFIG.VERSION}
        </p>
      </div>
    </div>
  );
}
