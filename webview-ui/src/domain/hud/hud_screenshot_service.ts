/**
 * HUD Screenshot Service
 * Infrastructure adapter for capturing and downloading graph screenshots.
 */

import { toPng } from 'html-to-image';
import { HUD_CONFIG } from './hud_config';

/**
 * Captures the React Flow viewport as a PNG data URL.
 * @returns Promise resolving to PNG data URL, or null if viewport not found.
 */
export async function captureGraphScreenshot(): Promise<string | null> {
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  
  if (!viewport) {
    console.warn('Screenshot: React Flow viewport not found');
    return null;
  }

  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: HUD_CONFIG.SCREENSHOT_BG_COLOR,
      width: viewport.scrollWidth,
      height: viewport.scrollHeight,
    });
    return dataUrl;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw error;
  }
}

/**
 * Downloads a data URL as a PNG file.
 * @param dataUrl - The PNG data URL to download.
 * @param filename - Optional custom filename (defaults to timestamped name).
 */
export function downloadScreenshot(dataUrl: string, filename?: string): void {
  const link = document.createElement('a');
  link.download = filename ?? `atomic-flow-graph-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Captures and immediately downloads a graph screenshot.
 * Convenience wrapper combining capture and download.
 */
export async function takeAndDownloadScreenshot(): Promise<void> {
  const dataUrl = await captureGraphScreenshot();
  if (dataUrl) {
    downloadScreenshot(dataUrl);
  }
}
