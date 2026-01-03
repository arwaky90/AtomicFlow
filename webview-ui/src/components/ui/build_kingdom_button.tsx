/**
 * BuildKingdomButton - Shows when hexagonal folders don't exist
 * Click to auto-scaffold missing folders
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, FolderPlus, Check, Loader2 } from 'lucide-react';
import { HEXAGONAL_FOLDERS } from '@/domain/scaffold';
import { postVsCodeMessage, isDevMode } from '@/composables/use_mock_vscode';

interface BuildKingdomButtonProps {
  missingFolders?: string[];
  onBuildComplete?: () => void;
  label?: string;
  variant?: 'kingdom' | 'setup';
}

export function BuildKingdomButton({ 
  missingFolders = [], 
  onBuildComplete,
  label,
  variant = 'kingdom'
}: BuildKingdomButtonProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Listen for mock success events in dev mode
  useEffect(() => {
    if (!isDevMode()) return;
    
    const handleMockSuccess = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.command === 'kingdomBuilt') {
        setIsBuilding(false);
        setIsComplete(true);
        onBuildComplete?.();
      }
    };
    
    window.addEventListener('vscode-message', handleMockSuccess);
    return () => window.removeEventListener('vscode-message', handleMockSuccess);
  }, [onBuildComplete]);

  // Don't show if all folders exist
  if (missingFolders.length === 0 && !isComplete) {
    return null;
  }

  const handleBuild = () => {
    if (isBuilding || isComplete) return;
    
    setIsBuilding(true);
    
    const folders = missingFolders.length > 0 
      ? missingFolders 
      : HEXAGONAL_FOLDERS.map(f => f.path);
    
    postVsCodeMessage({
      command: 'buildKingdom',
      folders
    });
    
    // For real VS Code, wait for actual response
    if (!isDevMode()) {
      setTimeout(() => {
        setIsBuilding(false);
        setIsComplete(true);
        onBuildComplete?.();
      }, 1500);
    }
    // Dev mode: handled by useEffect listener above
  };

  const isSetup = variant === 'setup';
  const defaultLabel = isSetup ? 'Set Up Folder' : 'Build Kingdom';
  const displayLabel = label || defaultLabel;

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400"
      >
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">{isSetup ? 'Folders Processed!' : 'Kingdom Built!'}</span>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleBuild}
      disabled={isBuilding}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-xl
        border-2 
        transition-all duration-300
        ${isSetup 
          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20'
          : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20'
        }
        ${isBuilding ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
      `}
    >
      <div className={`p-1.5 rounded-lg ${isSetup ? 'bg-blue-500/20' : 'bg-yellow-500/20'}`}>
        {isBuilding ? (
          <Loader2 className={`w-4 h-4 animate-spin ${isSetup ? 'text-blue-400' : 'text-yellow-400'}`} />
        ) : isSetup ? (
          <FolderPlus className="w-4 h-4 text-blue-400" />
        ) : (
          <Crown className="w-4 h-4 text-yellow-400" />
        )}
      </div>
      
      <div className="flex flex-col items-start gap-0.5">
        <span className={`text-xs font-bold ${isSetup ? 'text-blue-300' : 'text-yellow-300'}`}>
          {isBuilding ? 'Processing...' : displayLabel}
        </span>
        <span className={`text-[10px] ${isSetup ? 'text-blue-500/70' : 'text-yellow-500/70'}`}>
          {missingFolders.length > 0 
            ? `${missingFolders.length} missing`
            : 'Initialize structure'}
        </span>
      </div>
    </motion.button>
  );
}
