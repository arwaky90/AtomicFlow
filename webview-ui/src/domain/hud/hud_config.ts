/**
 * HUD Configuration Constants
 * Static configuration values for GraphHUD components.
 */

export const HUD_CONFIG = {
  /** Application version displayed in HUD */
  VERSION: 'v4.0.0',
  
  /** Interval for checking hexagonal folders (ms) */
  FOLDER_CHECK_INTERVAL_MS: 5000,
  
  /** Delay before resetting copied state (ms) */
  COPIED_RESET_DELAY_MS: 2000,
  
  /** Timeout for AI analysis file content requests (ms) */
  ANALYSIS_TIMEOUT_MS: 2000,
  
  /** Background color for graph screenshots */
  SCREENSHOT_BG_COLOR: '#0B0F14',
  
  /** Maximum nodes to analyze per AI batch */
  AI_BATCH_SIZE: 3,
  
  /** Confidence threshold for auto-moving files */
  AUTO_MOVE_CONFIDENCE_THRESHOLD: 0.7,
} as const;

export type HudConfig = typeof HUD_CONFIG;
