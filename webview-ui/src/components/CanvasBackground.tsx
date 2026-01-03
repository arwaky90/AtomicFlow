import { useFolderStore } from '@/store/folder_navigation_store';

export function CanvasBackground() {
  const { currentFolder, sourceRootName } = useFolderStore();
  
  const displayLabel = currentFolder 
    ? currentFolder.split('/').pop() 
    : sourceRootName;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-5">
      <h2 className="text-[20vw] font-black uppercase tracking-tighter text-foreground whitespace-nowrap">
        {displayLabel}
      </h2>
    </div>
  );
}
