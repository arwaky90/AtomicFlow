import { motion, AnimatePresence } from 'framer-motion';
import { useGraphStore } from '@/store/graphStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export function DeleteConfirmDialog() {
  const { isDeleteDialogOpen, nodesToDelete, closeDialogs, nodes } = useGraphStore();

  const handleConfirm = () => {
    nodesToDelete.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.data?.path) {
        window.vscode?.postMessage({
          command: 'deleteNode',
          path: node.data.path
        });
      }
    });
    closeDialogs();
  };

  if (!isDeleteDialogOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDialogs}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm"
        >
          <Card className="overflow-hidden border-destructive/50 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Confirm Deletion</span>
              </div>
              <Button variant="ghost" size="icon" onClick={closeDialogs} className="h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20 text-destructive mb-2">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold">Delete {nodesToDelete.length > 1 ? `${nodesToDelete.length} Nodes` : 'Node'}?</h3>
                <p className="text-sm text-muted-foreground">
                  This action will permanently delete the files from your storage. This is non-reversible.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button variant="destructive" onClick={handleConfirm} className="w-full h-11">
                  Permanently Delete
                </Button>
                <Button variant="ghost" onClick={closeDialogs} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
