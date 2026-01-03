/**
 * CreateNodeTemplatePicker - Template dropdown grid
 */
import { motion } from 'framer-motion';
import { FILE_TEMPLATES, type FileLanguage } from '@/domain/scaffold';

interface CreateNodeTemplatePickerProps {
  selectedExtension: FileLanguage;
  onSelect: (ext: FileLanguage) => void;
  onClose: () => void;
}

export function CreateNodeTemplatePicker({ 
  selectedExtension, 
  onSelect, 
  onClose 
}: CreateNodeTemplatePickerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="grid grid-cols-3 gap-2 p-2 bg-zinc-950 rounded-lg border border-zinc-800"
    >
      {FILE_TEMPLATES.map(template => (
        <button
          key={template.extension}
          onClick={() => {
            onSelect(template.extension);
            onClose();
          }}
          className={`
            p-2 rounded text-xs flex flex-col items-center gap-1 transition-all
            ${selectedExtension === template.extension 
              ? 'bg-primary/20 border border-primary/50 text-primary' 
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}
          `}
        >
          <span className="text-lg">{template.emoji}</span>
          <span className="font-mono">.{template.extension}</span>
        </button>
      ))}
    </motion.div>
  );
}
