import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SourceFolder {
  path: string;
  name: string;
  relativePath: string;
  fileCount: number;
}

interface DashboardProps {
  folders: SourceFolder[];
  workspaceRoot: string;
  onSelect: (path: string) => void;
}

/**
 * Dashboard - Source folder selection screen for Nuke-style workflow.
 * Shows detected source folders and lets user pick which to load.
 */
export function Dashboard({ folders, onSelect }: DashboardProps) {
  const [selectedPath, setSelectedPath] = useState<string>(
    folders.length > 0 ? folders[0].path : ''
  );

  const handleLoad = () => {
    if (selectedPath) {
      onSelect(selectedPath);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/20 p-3 rounded-xl">
            <Zap className="text-primary w-8 h-8 fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Atomic Flow</h1>
            <p className="text-sm text-muted-foreground">Select source folder to visualize</p>
          </div>
        </div>

        {/* Folder List */}
        <Card className="p-4 bg-background/80 backdrop-blur border-border/50">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Detected Source Folders:
          </p>
          
          <div className="space-y-2">
            {folders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => setSelectedPath(folder.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  selectedPath === folder.path
                    ? 'bg-primary/20 border border-primary/50'
                    : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-700/50'
                }`}
              >
                {/* Radio Indicator */}
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedPath === folder.path
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {selectedPath === folder.path && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>

                {/* Folder Icon */}
                <Folder className={`w-5 h-5 ${
                  selectedPath === folder.path ? 'text-primary' : 'text-muted-foreground'
                }`} />

                {/* Folder Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{folder.name || folder.relativePath}</p>
                  <p className="text-xs text-muted-foreground">
                    {folder.fileCount} files
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-muted-foreground">
            Selection will be cached
          </p>
          <Button
            onClick={handleLoad}
            disabled={!selectedPath}
            className="gap-2"
          >
            Load Folder
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
