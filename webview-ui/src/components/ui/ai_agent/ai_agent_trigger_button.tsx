import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

interface AiAgentTriggerButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Animated trigger button to open the AI Agent dialog.
 * Presentation-only component - receives all behavior via props.
 */
export function AiAgentTriggerButton({ onClick, disabled = false }: AiAgentTriggerButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl
        bg-gradient-to-r from-blue-500/20 to-cyan-500/20
        border border-blue-500/40
        hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]
        transition-all duration-300
        cursor-pointer
      `}
    >
      <Bot className="w-5 h-5 text-blue-400" />
      <span className="text-xs font-semibold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
        Ask Agent
      </span>
    </motion.button>
  );
}
